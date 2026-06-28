#!/usr/bin/env bash
# Aserciones de RLS contra el Postgres local, simulando 3 usuarios.
set -u
PASS=0; FAIL=0
U1='11111111-1111-1111-1111-111111111111'  # admin Org A
U2='22222222-2222-2222-2222-222222222222'  # member Org A
U3='33333333-3333-3333-3333-333333333333'  # admin Org B
OBJ='dddddddd-dddd-dddd-dddd-dddddddddddd'
KR='eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
ORGA='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

# raw <sub> "<sql>" -> salida cruda (incluye errores en stderr)
raw() {
  docker exec -i "${CONTAINER:-gb-pg}" psql -U postgres -d goalboard -qtAX 2>&1 <<SQL
set request.jwt.claims to '{"sub":"$1"}';
set role authenticated;
$2
SQL
}
# val: igual pero filtra tags de comando (SET/INSERT/UPDATE/...) y deja el dato
val() { raw "$1" "$2" | grep -vE '^(SET|INSERT [0-9]|UPDATE [0-9]|DELETE [0-9]|BEGIN|COMMIT|ROLLBACK)$|^(INSERT|UPDATE|DELETE) ' | sed '/^$/d' | tail -1; }

check()  { if [ "$2" = "$3" ]; then echo "PASS  $1"; PASS=$((PASS+1)); else echo "FAIL  $1 (got:[$2] exp:[$3])"; FAIL=$((FAIL+1)); fi; }
contains(){ if echo "$2" | grep -q "$3"; then echo "PASS  $1"; PASS=$((PASS+1)); else echo "FAIL  $1 (got:[$2] needle:[$3])"; FAIL=$((FAIL+1)); fi; }

echo "── Transparencia / aislamiento ──"
check "u2(member) ve objetivo de u1" "$(val $U2 "select count(*) from public.objectives where organization_id='$ORGA';")" "1"
check "u3(otra org) NO ve Org A"      "$(val $U3 "select count(*) from public.objectives where organization_id='$ORGA';")" "0"

echo "── Escritura ajena bloqueada ──"
check    "u2 NO edita objetivo ajeno (0 filas)" "$(val $U2 "update public.objectives set title='x' where id='$OBJ' returning id;")" ""
contains "u2 NO hace check-in ajeno"            "$(raw $U2 "insert into public.check_ins (organization_id,key_result_id,author_id,value,confidence) values ('$ORGA','$KR','$U2',9,'en_camino');")" "row-level security"

echo "── Gestión solo admin ──"
contains "u2(member) NO crea ciclo" "$(raw $U2 "insert into public.cycles (organization_id,name,cadence) values ('$ORGA','Q1','trimestral');")" "row-level security"
check    "u1(admin) SÍ crea ciclo"  "$(val $U1 "insert into public.cycles (organization_id,name,cadence) values ('$ORGA','Q1','trimestral') returning cadence;")" "trimestral"

echo "── Check-in del dueño + trigger + progreso ──"
raw $U1 "insert into public.check_ins (organization_id,key_result_id,author_id,value,confidence) values ('$ORGA','$KR','$U1',200,'en_camino');" >/dev/null
check "check-in del dueño: KR=200, progreso 0.50 (trigger)" "$(val $U1 "select current_value::int||'/'||round(progress,2) from public.key_results where id='$KR';")" "200/0.50"

echo "── Bootstrap create_organization ──"
NEWORG=$(val $U1 "select id from public.create_organization('Solo de u1');")
check "create_organization devuelve una org" "$([ -n "$NEWORG" ] && echo ok)" "ok"
check "creador queda admin de la nueva org" "$(val $U1 "select role from public.memberships where organization_id='$NEWORG' and user_id='$U1';")" "admin"

echo "── CHECK scoring fuera de rango ──"
contains "score 1.5 rechazado (CHECK 0..1)" "$(raw $U1 "update public.key_results set score=1.5 where id='$KR';")" "violates check constraint"

echo "── KR de hito (binario) ──"
raw $U1 "insert into public.key_results (id,organization_id,objective_id,title,type,start_value,target_value,current_value) values ('ffffffff-ffff-ffff-ffff-ffffffffffff','$ORGA','$OBJ','v1','hito',0,1,0) on conflict do nothing;" >/dev/null
check "hito no cumplido -> 0" "$(val $U1 "select round(progress,2) from public.key_results where id='ffffffff-ffff-ffff-ffff-ffffffffffff';")" "0.00"
raw $U1 "update public.key_results set current_value=1 where id='ffffffff-ffff-ffff-ffff-ffffffffffff';" >/dev/null
check "hito cumplido -> 1"    "$(val $U1 "select round(progress,2) from public.key_results where id='ffffffff-ffff-ffff-ffff-ffffffffffff';")" "1.00"

echo ""
echo "================  $PASS PASS / $FAIL FAIL  ================"
[ "$FAIL" -eq 0 ]
