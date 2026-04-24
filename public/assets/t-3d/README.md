# Asset 3D do T — TecnoPUC

Coloque o arquivo 3D do "T" aqui com o nome exato:

```
t-core.glb
```

## Requisitos do arquivo

- Formato: **GLB** (binary glTF 2.0)
- Pivot/origem: centrado no modelo (0, 0, 0)
- Escala: normalizada para caber em ~1 unidade Three.js
- Materiais: PBR (Physically Based Rendering) recomendado
- Sem animações embutidas — os estados são controlados pelo TStateMachine

## Como exportar do Blender

1. File → Export → glTF 2.0
2. Format: GLB
3. Marcar: "Apply Modifiers", "UVs", "Normals", "Materials"
4. Desmarcar: "Animations" (não necessário)
