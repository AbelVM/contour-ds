# Native token export

Contour's token layer ships as DTCG 2025.10 (`dist/contour.tokens.json`), so it
feeds [Style Dictionary](https://styledictionary.com/) directly. The config
above emits Swift, Android XML and Flutter tokens from the same source.

Requires Style Dictionary **v4 or later** (DTCG support landed in v4; v3 and
earlier cannot parse the `$value`/`$type` records and will emit an empty or
malformed class). Tested against v5.7.

```bash
npx style-dictionary@^5 build --config integrations/native/style-dictionary.config.json
```

Spatial interfaces often ship native companions (iOS/Android field apps); this
keeps their palette in sync with the web system.

Spatial interfaces often ship native companions (iOS/Android field apps); this
keeps their palette in sync with the web system.
