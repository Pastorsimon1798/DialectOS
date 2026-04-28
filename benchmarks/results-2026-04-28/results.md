# DialectOS Benchmark Report

- **Date**: 2026-04-28T00:21:56.876Z
- **Provider**: mock-semantic
- **Live**: false
- **Total**: 130
- **Passed**: 86
- **Failed**: 44
- **Pass rate**: 66.2%
- **Avg quality score**: 92

## By Category

| Category | Passed | Total | Rate |
|----------|--------|-------|------|
| dialect-collision | 11 | 13 | 84.6% |
| false-friend | 16 | 17 | 94.1% |
| intent-ambiguity | 13 | 14 | 92.9% |
| morphology-trap | 4 | 13 | 30.8% |
| negative-control | 4 | 13 | 30.8% |
| over-localization | 11 | 12 | 91.7% |
| register-trap | 12 | 12 | 100.0% |
| structure-preservation | 12 | 12 | 100.0% |
| taboo-copy | 3 | 12 | 25.0% |
| under-localization | 0 | 12 | 0.0% |

## By Dialect

| Dialect | Passed | Total | Rate |
|---------|--------|-------|------|
| es-AD | 4 | 5 | 80.0% |
| es-AR | 4 | 5 | 80.0% |
| es-BO | 3 | 5 | 60.0% |
| es-BZ | 3 | 5 | 60.0% |
| es-CL | 4 | 6 | 66.7% |
| es-CO | 3 | 5 | 60.0% |
| es-CR | 3 | 5 | 60.0% |
| es-CU | 2 | 5 | 40.0% |
| es-DO | 2 | 5 | 40.0% |
| es-EC | 3 | 5 | 60.0% |
| es-ES | 4 | 5 | 80.0% |
| es-GQ | 4 | 5 | 80.0% |
| es-GT | 4 | 5 | 80.0% |
| es-HN | 4 | 5 | 80.0% |
| es-MX | 4 | 6 | 66.7% |
| es-NI | 4 | 5 | 80.0% |
| es-PA | 3 | 5 | 60.0% |
| es-PE | 3 | 5 | 60.0% |
| es-PH | 4 | 5 | 80.0% |
| es-PR | 3 | 8 | 37.5% |
| es-PY | 4 | 5 | 80.0% |
| es-SV | 4 | 5 | 80.0% |
| es-US | 3 | 5 | 60.0% |
| es-UY | 4 | 5 | 80.0% |
| es-VE | 3 | 5 | 60.0% |

## Failures

### ad-plural-vosotros (es-AD)
- **Source**: You can all update your passwords now.
- **Output**: You can all update your passwords now.
- **FAIL**: Missing required output: vosotros, podéis, vuestras
- **FAIL**: Judge [major] accuracy: Output is unchanged despite English source text.

### ar-pickup-package (es-AR)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### bo-hot-sauce-llajwa (es-BO)
- **Source**: Buy hot sauce for lunch.
- **Output**: Buy hot sauce for lunch.
- **FAIL**: Missing required output: llajwa, llajua

### bo-pickup-package (es-BO)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### bz-formal-support (es-BZ)
- **Source**: Contact support if the payment fails.
- **Output**: Contact support if the payment fails.
- **FAIL**: Judge [major] accuracy: Output is unchanged despite English source text.

### bz-pickup-package (es-BZ)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### cl-avocado-palta (es-CL)
- **Source**: Buy avocado for lunch.
- **Output**: Compra aguacate para el almuerzo.
- **FAIL**: Forbidden term: aguacate
- **FAIL**: Missing required output: palta
- **FAIL**: Judge [critical] taboo-safety: Forbidden term present: aguacate

### cl-pickup-package (es-CL)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### co-computer-computador (es-CO)
- **Source**: Use the computer to open the file.
- **Output**: Usa la computadora para abrir el archivo.
- **FAIL**: Missing required output: computador

### co-pickup-package (es-CO)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### cr-formal-support (es-CR)
- **Source**: Contact support if the payment fails.
- **Output**: Contact support if the payment fails.
- **FAIL**: Judge [major] accuracy: Output is unchanged despite English source text.

### cr-pickup-package (es-CR)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### cu-transit-paraphrase (es-CU)
- **Source**: Get on the bus to the office.
- **Output**: Get on the bus to the office.
- **FAIL**: Missing required group: toma, tomar, aborda, abordar
- **FAIL**: Missing required output: guagua
- **FAIL**: Judge [major] accuracy: Output is unchanged despite English source text.
- **FAIL**: Judge [critical] accuracy: Missing required semantic trait for es-CU; expected one of: toma, tomar, aborda, abordar

### cu-formal-support (es-CU)
- **Source**: Contact support if the payment fails.
- **Output**: Contact support if the payment fails.
- **FAIL**: Judge [major] accuracy: Output is unchanged despite English source text.

### cu-pickup-package (es-CU)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### do-transit-paraphrase (es-DO)
- **Source**: Catch the bus to the office.
- **Output**: Toma el autobús a la oficina.
- **FAIL**: Missing required output: guagua

### do-formal-support (es-DO)
- **Source**: Contact support if the payment fails.
- **Output**: Contact support if the payment fails.
- **FAIL**: Judge [major] accuracy: Output is unchanged despite English source text.

### do-pickup-package (es-DO)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### ec-computer-computador (es-EC)
- **Source**: Use the computer to open the file.
- **Output**: Usa la computadora para abrir el archivo.
- **FAIL**: Missing required output: computador

### ec-pickup-package (es-EC)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### es-plural-vosotros (es-ES)
- **Source**: You can all update your passwords now.
- **Output**: You can all update your passwords now.
- **FAIL**: Missing required output: vosotros, podéis, vuestras
- **FAIL**: Judge [major] accuracy: Output is unchanged despite English source text.

### gq-yam-name (es-GQ)
- **Source**: Use yam in the recipe.
- **Output**: Use yam in the recipe.
- **FAIL**: Missing required output: ñame
- **FAIL**: Judge [major] accuracy: Output is unchanged despite English source text.

### gt-pickup-package (es-GT)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### hn-pickup-package (es-HN)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### mx-pickup-file (es-MX)
- **Source**: Pick up the file before deployment.
- **Output**: Recoge el archivo antes del despliegue.

### mx-pickup-package (es-MX)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### ni-pickup-package (es-NI)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### pa-formal-support (es-PA)
- **Source**: Contact support if the payment fails.
- **Output**: Contact support if the payment fails.
- **FAIL**: Judge [major] accuracy: Output is unchanged despite English source text.

### pa-pickup-package (es-PA)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### pe-formal-support (es-PE)
- **Source**: Contact support if the payment fails.
- **Output**: Contact support if the payment fails.
- **FAIL**: Judge [major] accuracy: Output is unchanged despite English source text.

### pe-pickup-package (es-PE)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### ph-philippine-names (es-PH)
- **Source**: Preserve Philippine names in the file.
- **Output**: Preserve Philippine names in the file.
- **FAIL**: Missing required output: filipinos, Filipinas, filipinas
- **FAIL**: Judge [major] accuracy: Output is unchanged despite English source text.

### pr-transit-paraphrase (es-PR)
- **Source**: Ride the bus to the office.
- **Output**: Ride the bus to the office.
- **FAIL**: Missing required group: toma, tomar, aborda, abordar
- **FAIL**: Missing required output: guagua
- **FAIL**: Judge [major] accuracy: Output is unchanged despite English source text.
- **FAIL**: Judge [critical] accuracy: Missing required semantic trait for es-PR; expected one of: toma, tomar, aborda, abordar

### pr-formal-support (es-PR)
- **Source**: Contact support if the payment fails.
- **Output**: Contact support if the payment fails.
- **FAIL**: Judge [major] accuracy: Output is unchanged despite English source text.

### pr-pickup-package (es-PR)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### pr-tidy-room (es-PR)
- **Source**: Pick up the room before guests arrive.
- **Output**: Pick up the room before guests arrive.
- **FAIL**: Missing required group: cuarto, habitación
- **FAIL**: Missing required group: recoge, recoger, ordena, ordenar, arregla, arreglar
- **FAIL**: Missing required group: cuarto, habitación
- **FAIL**: Missing required group: recoge, recoger, ordena, ordenar, arregla, arreglar
- **FAIL**: Judge [major] accuracy: Output is unchanged despite English source text.
- **FAIL**: Judge [critical] accuracy: Missing required semantic trait for es-PR; expected one of: cuarto, habitación
- **FAIL**: Judge [critical] accuracy: Missing required semantic trait for es-PR; expected one of: recoge, recoger, ordena, ordenar, arregla, arreglar
- **FAIL**: Judge [critical] accuracy: Missing required semantic trait for es-PR; expected one of: cuarto, habitación
- **FAIL**: Judge [critical] accuracy: Missing required semantic trait for es-PR; expected one of: recoge, recoger, ordena, ordenar, arregla, arreglar

### pr-orange-juice-china (es-PR)
- **Source**: Orange juice is ready.
- **Output**: Orange juice is ready.
- **FAIL**: Missing required group: jugo
- **FAIL**: Missing required group: china
- **FAIL**: Missing required group: jugo, zumo
- **FAIL**: Missing required group: china, naranja
- **FAIL**: Judge [critical] accuracy: Missing required semantic trait for es-PR; expected one of: jugo
- **FAIL**: Judge [critical] accuracy: Missing required semantic trait for es-PR; expected one of: china
- **FAIL**: Judge [critical] accuracy: Missing required semantic trait for es-PR; expected one of: jugo, zumo
- **FAIL**: Judge [critical] accuracy: Missing required semantic trait for es-PR; expected one of: china, naranja

### py-pickup-package (es-PY)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### sv-pickup-package (es-SV)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### us-public-parking (es-US)
- **Source**: Park the car near the office.
- **Output**: Estaciona el coche cerca de la oficina.

### us-pickup-package (es-US)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### uy-pickup-package (es-UY)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

### ve-formal-support (es-VE)
- **Source**: Contact support if the payment fails.
- **Output**: Contact support if the payment fails.
- **FAIL**: Judge [major] accuracy: Output is unchanged despite English source text.

### ve-pickup-package (es-VE)
- **Source**: Pick up the package from reception.
- **Output**: Recoge el paquete de recepción.

