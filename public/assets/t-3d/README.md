# Asset 3D do T — TecnoPUC

Arquivo canônico:

```
t-core.glb
```

Carregado por `src/components/t-core/TMesh.tsx` via `useGLTF('/assets/t-3d/t-core.glb')`. Preload disparado em `src/app/layout.tsx` (`<link rel="preload" as="fetch">`).

## Requisitos do arquivo

- Formato: **GLB** (binary glTF 2.0)
- Pivot/origem: centrado no modelo (0, 0, 0)
- Materiais: PBR — `MeshStandardMaterial` é o que o `TMesh` muta para aplicar emissive por estado
- Sem animações embutidas — os estados são controlados pelo `TStateMachine`
- A escala é amplificada por `BASE_SCALE = 22` em `TMesh.tsx`. Se trocar o asset por um com bbox muito diferente, ajustar essa constante.

## Como exportar do Blender

1. File → Export → glTF 2.0
2. Format: GLB
3. Marcar: "Apply Modifiers", "UVs", "Normals", "Materials"
4. Desmarcar: "Animations"

## Pipeline de compressão (obrigatório antes de comitar)

O modelo do TecnoPUC é simples (poucos polígonos), o peso vem das texturas. Sempre rodar:

```bash
cd public/assets/t-3d
npx @gltf-transform/cli resize t-core.glb t-core.glb --width 1024 --height 1024
npx @gltf-transform/cli webp t-core.glb t-core.glb
```

Alvo: <300 KB. A versão atual partiu de 5,3 MB e baixou para ~198 KB com esse pipeline.
