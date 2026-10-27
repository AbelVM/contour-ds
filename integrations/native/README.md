# Native token export

Contour's token layer ships as DTCG 2025.10 (`dist/contour.tokens.json`), so it
feeds [Style Dictionary](https://styledictionary.com/) directly. The config
above emits Swift, Android XML and Flutter tokens from the same source.

```bash
npx style-dictionary build --config integrations/native/style-dictionary.config.json
```

Spatial interfaces often ship native companions (iOS/Android field apps); this
keeps their palette in sync with the web system.
