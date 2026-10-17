"""Gera exercicios.json para a Forja a partir da free-exercise-db (domínio público, Unlicense).
Uso: python3 ferramentas/construir_exercicios.py  (a partir da raiz do repositório)"""
import json, re, os, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
FONTE = json.load(open(os.path.join(AQUI, 'fonte_exercises.json')))
NOMES = json.load(open(os.path.join(AQUI, 'nomes_pt.json'))) if os.path.exists(os.path.join(AQUI, 'nomes_pt.json')) else {}

EQ = {'body only': 'corpo', 'dumbbell': 'halteres', 'barbell': 'barra', 'kettlebells': 'kettlebell', 'bands': 'elasticos',
      'cable': 'cabos', 'machine': 'maquinas', 'e-z curl bar': 'barraEZ', 'medicine ball': 'bolaMed',
      'exercise ball': 'bolaSuica', 'foam roll': 'rolo', None: 'corpo'}
# Exercícios com equipamento "other": só os que fazem sentido num ginásio caseiro, com o que exigem.
OUTROS = {
  'Band Assisted Pull-Up': ['elevacoes', 'elasticos'], 'Gironda Sternum Chins': ['elevacoes'], 'Kipping Muscle Up': ['elevacoes'],
  'Mixed Grip Chin': ['elevacoes'], 'Muscle Up': ['elevacoes'], 'One Arm Chin-Up': ['elevacoes'], 'One Handed Hang': ['elevacoes'],
  'Rocky Pull-Ups/Pulldowns': ['elevacoes'], 'Side To Side Chins': ['elevacoes'], 'Weighted Pull Ups': ['elevacoes'],
  'Dips - Chest Version': ['paralelas'], 'Parallel Bar Dip': ['paralelas'], 'Knee/Hip Raise On Parallel Bars': ['paralelas'],
  'Weighted Bench Dip': ['banco', 'barra'], 'Bench Sprint': ['banco'],
  'Box Jump (Multiple Response)': ['caixa'], 'Box Skip': ['caixa'], 'Front Box Jump': ['caixa'], 'Lateral Box Jump': ['caixa'],
  'Depth Jump Leap': ['caixa'], 'Linear Depth Jump': ['caixa'], 'Side to Side Box Shuffle': ['caixa'], 'Single-Leg High Box Squat': ['caixa'],
  'Front Plate Raise': ['barra'], 'Plate Pinch': ['barra'], 'Plate Twist': ['barra'], 'Reverse Plate Curls': ['barra'],
  'Standing Olympic Plate Hand Squeeze': ['barra'], 'Svend Press': ['barra'], 'Otis-Up': ['barra'],
  'Weighted Sit-Ups - With Bands': ['elasticos'], 'Seated Band Hamstring Curl': ['elasticos'],
  'Rope Jumping': ['corda'], 'Ab Roller': ['rodaAbs'],
  'Suspended Fallout': ['trx'], 'Suspended Push-Up': ['trx'], 'Suspended Reverse Crunch': ['trx'], 'Suspended Row': ['trx'],
  'Suspended Split Squat': ['trx'], 'Inverted Row with Straps': ['trx'],
  'Anterior Tibialis-SMR': ['rolo'], 'Foot-SMR': ['rolo'], 'Neck-SMR': ['rolo'],
  'Hyperextensions (Back Extensions)': ['maquinas'],
}
CORPO_OUTROS = ['Behind Head Chest Stretch', 'Chest And Front Of Shoulder Stretch', 'Intermediate Groin Stretch',
  'Intermediate Hip Flexor and Quad Stretch', 'IT Band and Glute Stretch', 'Lying Bent Leg Groin', 'Lying Hamstring',
  'On-Your-Back Quad Stretch', 'Overhead Lat', 'Peroneals Stretch', 'Posterior Tibialis Stretch', 'Quad Stretch',
  'Round The World Shoulder Stretch', 'Seated Hamstring and Calf Stretch', 'Standing Biceps Stretch', 'Standing Elevated Quad Stretch',
  'Standing Hamstring and Calf Stretch', 'Chair Leg Extended Stretch', 'Chair Upper Body Stretch', 'Front Cone Hops (or hurdle hops)',
  'Hurdle Hops', 'Lateral Cone Hops', 'Quick Leap', 'Side Hop-Sprint', 'Single-Leg Hop Progression', 'Single-Leg Lateral Hop',
  'Single-Leg Stride Jump', 'Single Leg Push-off', 'Stride Jump Crossover', 'Single-Cone Sprint Drill', 'Skating', 'Drop Push',
  'Incline Push-Up Depth Jump']
for n in CORPO_OUTROS: OUTROS[n] = ['corpo']
FORA = re.compile(r'\b(partner|sled|tire|keg|yoke|prowler|smith|chains?|trap bar|sledgehammer|harness|rope climb|atlas|log lift|farmer)\b', re.I)

def requisitos(x):
    nome, eq = x['name'], x.get('equipment')
    texto = (nome + ' ' + ' '.join(x.get('instructions') or [])).lower()
    if eq == 'other':
        if nome not in OUTROS: return None
        req = set(OUTROS[nome])
    else:
        req = {EQ.get(eq, 'corpo')}
        if eq is None:
            if nome == 'Inverted Row': req = {'barra', 'rack'}
            if nome == 'Scapular Pull-Up': req = {'elevacoes'}
    if eq in ('body only', None):
        if re.search(r'pull-?ups?|chin-?ups?|\bchins?\b|hanging|muscle.?up', nome, re.I): req.add('elevacoes')
        if re.search(r'\bdips?\b', nome, re.I) and not re.search(r'bench', nome, re.I): req.add('paralelas')
    alvo_banco = nome.lower() if eq in ('body only', None) else texto  # no peso corporal, só se o nome o pedir
    if re.search(r'\b(bench|preacher|incline|decline|elevated)\b', alvo_banco) and 'banco' not in req and eq not in ('machine',):
        if eq not in ('body only', None) or re.search(r'bench|decline|elevated', alvo_banco): req.add('banco')
    if eq == 'barbell' and (re.search(r'\b(squat rack|power rack|rack|squat stands?|j-hooks|pins|uprights)\b', texto)
                            or re.search(r'squat|bench press', nome, re.I)):
        req.add('rack')
    if re.search(r'\bbox\b', nome, re.I) and 'caixa' not in req: req.add('caixa')
    if 'corpo' in req and len(req) > 1: req.discard('corpo')
    return sorted(req)

MUSC = {'abdominals': 'abs', 'shoulders': 'ombros', 'quadriceps': 'quads', 'chest': 'peito', 'hamstrings': 'post',
        'triceps': 'triceps', 'biceps': 'biceps', 'lats': 'dorsais', 'middle back': 'costas', 'calves': 'gemeos',
        'lower back': 'lombar', 'forearms': 'antebracos', 'glutes': 'gluteos', 'traps': 'trapezio',
        'adductors': 'adutores', 'neck': 'pescoco', 'abductors': 'abdutores'}
CAT = {'strength': 'forca', 'powerlifting': 'forca', 'olympic weightlifting': 'olimpico', 'plyometrics': 'pliometria',
       'stretching': 'alongamento', 'cardio': 'cardio'}

ESSENCIAIS = set("Barbell_Bench_Press_-_Medium_Grip Barbell_Incline_Bench_Press_-_Medium_Grip Dumbbell_Bench_Press Incline_Dumbbell_Press Dumbbell_Flyes Incline_Dumbbell_Flyes Pushups Push-Ups_With_Feet_Elevated Dips_-_Chest_Version Parallel_Bar_Dip Close-Grip_Barbell_Bench_Press Standing_Military_Press Dumbbell_Shoulder_Press Seated_Dumbbell_Press Arnold_Dumbbell_Press Side_Lateral_Raise Front_Dumbbell_Raise Reverse_Flyes Face_Pull Lying_Triceps_Press EZ-Bar_Skullcrusher Standing_Dumbbell_Triceps_Extension Tricep_Dumbbell_Kickback Bench_Dips Triceps_Pushdown Pullups Chin-Up Bent_Over_Barbell_Row One-Arm_Dumbbell_Row Bent_Over_Two-Dumbbell_Row Inverted_Row Wide-Grip_Lat_Pulldown Seated_Cable_Rows Barbell_Deadlift Barbell_Curl Dumbbell_Bicep_Curl Hammer_Curls Incline_Dumbbell_Curl Concentration_Curls EZ-Bar_Curl Barbell_Shrug Dumbbell_Shrug Barbell_Squat Front_Barbell_Squat Goblet_Squat Romanian_Deadlift Stiff-Legged_Dumbbell_Deadlift Barbell_Hip_Thrust Barbell_Glute_Bridge Dumbbell_Lunges Barbell_Lunge Split_Squat_with_Dumbbells Dumbbell_Step_Ups Bodyweight_Squat Standing_Calf_Raises Standing_Dumbbell_Calf_Raise Sumo_Deadlift Good_Morning One-Arm_Kettlebell_Swings Kettlebell_One-Legged_Deadlift Plank Hanging_Leg_Raise Crunches Russian_Twist Dead_Bug Side_Bridge Ab_Roller Barbell_Ab_Rollout_-_On_Knees Mountain_Climbers Band_Pull_Apart Pallof_Press Upright_Barbell_Row Kettlebell_Thruster Two-Arm_Kettlebell_Row Push_Press Power_Clean Leg_Press Leg_Extensions Lying_Leg_Curls Cable_Crossover Kettlebell_Turkish_Get-Up_Squat_style Single_Leg_Glute_Bridge Superman Hyperextensions_Back_Extensions Decline_Push-Up Push-Up_Wide Push-Ups_-_Close_Triceps_Position Squats_-_With_Bands Lateral_Raise_-_With_Bands Shoulder_Press_-_With_Bands Dumbbell_Floor_Press Floor_Press Straight-Arm_Dumbbell_Pullover Front_Squats_With_Two_Kettlebells Two-Arm_Kettlebell_Military_Press Freehand_Jump_Squat Weighted_Pull_Ups Scapular_Pull-Up".split())
saida, semnome = [], []
for x in FONTE:
    if x['category'] == 'strongman' or FORA.search(x['name']): continue
    req = requisitos(x)
    if req is None: continue
    pt = NOMES.get(x['id'])
    if not pt: semnome.append(x['id'])
    saida.append({
        'id': x['id'], 'n': pt or x['name'], 'en': x['name'], 'req': req,
        'p': [MUSC[m] for m in x['primaryMuscles']], 's': [MUSC[m] for m in x['secondaryMuscles']],
        'c': CAT[x['category']], 'l': {'beginner': 1, 'intermediate': 2, 'expert': 3}[x['level']],
        'm': 1 if x.get('mechanic') == 'compound' else 0, 'f': (x.get('force') or '')[:4],
        'e': 1 if x['id'] in ESSENCIAIS else 0, 'i': x.get('images') or [], 'ins': x.get('instructions') or []})

if '--lista' in sys.argv:
    ids = sorted(e['id'] for e in saida)
    json.dump(ids, open(os.path.join(AQUI, 'ordem_ids.json'), 'w'))
    en = {e['id']: e['en'] for e in saida}
    print(' ; '.join(f'{i}={en[k]}' for i, k in enumerate(ids)))
    sys.exit()
json.dump(saida, open(os.path.join(AQUI, '..', 'exercicios.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
from collections import Counter
print(len(saida), 'exercícios;', len(semnome), 'sem nome PT')
print(Counter(r for e in saida for r in e['req']))
print(Counter(e['c'] for e in saida))
