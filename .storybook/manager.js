import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

const brandImage = "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2032%2032%22%20width%3D%2232%22%20height%3D%2232%22%3E%3Crect%20width%3D%2232%22%20height%3D%2232%22%20rx%3D%228%22%20fill%3D%22%230b1110%22/%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%2335cdb0%22%20stroke-width%3D%221.4%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2012.25%206.29%20C%2011.9%206.4%2011.0%206.7%2010.4%207.1%20C%209.8%207.5%209.3%208.1%208.8%208.7%20C%208.4%209.3%208.0%2010.1%207.8%2010.8%20C%207.5%2011.5%207.4%2012.2%207.3%2012.9%20C%207.2%2013.6%207.1%2014.3%207.1%2015.0%20C%207.1%2015.7%207.1%2016.3%207.1%2017.0%20C%207.1%2017.7%207.2%2018.4%207.3%2019.1%20C%207.4%2019.8%207.5%2020.5%207.8%2021.2%20C%208.0%2021.9%208.4%2022.7%208.8%2023.3%20C%209.2%2023.9%209.7%2024.4%2010.3%2024.8%20C%2011.0%2025.2%2011.8%2025.6%2012.5%2025.8%20C%2013.2%2025.9%2013.8%2025.9%2014.5%2025.9%20C%2015.2%2025.8%2016.0%2025.7%2016.7%2025.5%20C%2017.4%2025.3%2018.0%2025.0%2018.7%2024.7%20C%2019.4%2024.3%2020.2%2023.9%2020.8%2023.5%20C%2021.4%2023.2%2022.0%2022.8%2022.5%2022.4%20C%2023.1%2022.0%2023.6%2021.6%2024.1%2021.1%20C%2024.6%2020.6%2025.1%2020.1%2025.4%2019.5%20C%2025.8%2018.9%2026.1%2018.2%2026.3%2017.5%20C%2026.5%2016.8%2026.5%2016.1%2026.5%2015.4%20C%2026.4%2014.7%2026.2%2014.0%2025.9%2013.4%20C%2025.6%2012.8%2025.1%2012.1%2024.7%2011.5%20C%2024.2%2010.9%2023.7%2010.5%2023.1%2010.1%20C%2022.6%209.6%2022.0%209.2%2021.4%208.8%20C%2020.8%208.4%2020.2%208.1%2019.6%207.8%20C%2018.9%207.4%2018.2%207.1%2017.5%206.8%20C%2016.8%206.5%2016.1%206.3%2015.4%206.2%20C%2014.7%206.1%2013.8%206.1%2013.3%206.1%20C%2012.8%206.1%2012.4%206.3%2012.2%206.3%22%20opacity%3D%221%22/%3E%3Cpath%20d%3D%22M%2013.91%2010.92%20C%2013.6%2011.2%2012.5%2011.9%2012.0%2012.5%20C%2011.6%2013.1%2011.5%2013.8%2011.4%2014.5%20C%2011.3%2015.2%2011.3%2015.9%2011.3%2016.6%20C%2011.4%2017.3%2011.4%2018.0%2011.6%2018.7%20C%2011.9%2019.3%2012.3%2020.1%2012.9%2020.5%20C%2013.4%2020.9%2014.3%2021.2%2015.0%2021.2%20C%2015.7%2021.2%2016.3%2021.0%2017.0%2020.7%20C%2017.7%2020.5%2018.5%2020.0%2019.1%2019.6%20C%2019.8%2019.1%2020.5%2018.6%2020.9%2017.9%20C%2021.3%2017.3%2021.5%2016.5%2021.5%2015.8%20C%2021.5%2015.1%2021.1%2014.4%2020.7%2013.8%20C%2020.3%2013.3%2019.7%2012.8%2019.1%2012.4%20C%2018.5%2012.0%2017.8%2011.6%2017.1%2011.3%20C%2016.4%2011.1%2015.5%2010.9%2015.0%2010.8%20C%2014.4%2010.7%2014.1%2010.9%2013.9%2010.9%22%20opacity%3D%220.5%22/%3E%3C/g%3E%3Ccircle%20cx%3D%2216.0%22%20cy%3D%2216.0%22%20r%3D%221.6%22%20fill%3D%22%23f20084%22/%3E%3C/svg%3E";

const lightTheme = create({
  base: "light",
  brandTitle: "Contour",
  brandImage,
  brandTarget: "_self",
  colorPrimary: "#007769",
  colorSecondary: "#c60066",
  appBg: "#f0f4f6",
  appContentBg: "#ffffff",
  appBorderColor: "#c7cfd3",
  appBorderRadius: 6,
  fontBase: '"Inter", system-ui, sans-serif',
  fontCode: '"JetBrains Mono", ui-monospace, monospace',
  textColor: "#2b373e",
  textInverseColor: "#ffffff",
  barTextColor: "#2b373e",
  barSelectedColor: "#007769",
  barBg: "#f0f4f6",
  inputBg: "#ffffff",
  inputBorder: "#c7cfd3",
  inputTextColor: "#2b373e",
  inputBorderRadius: 4,
});

const darkTheme = create({
  base: "dark",
  brandTitle: "Contour",
  brandImage,
  brandTarget: "_self",
  colorPrimary: "#57cebd",
  colorSecondary: "#f20084",
  appBg: "#02070a",
  appContentBg: "#071116",
  appBorderColor: "#49555b",
  appBorderRadius: 6,
  fontBase: '"Inter", system-ui, sans-serif',
  fontCode: '"JetBrains Mono", ui-monospace, monospace',
  textColor: "#dfe6e9",
  textInverseColor: "#02070a",
  barTextColor: "#dfe6e9",
  barSelectedColor: "#57cebd",
  barBg: "#02070a",
  inputBg: "#071116",
  inputBorder: "#49555b",
  inputTextColor: "#dfe6e9",
  inputBorderRadius: 4,
});

const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
addons.setConfig({
  theme: prefersDark ? darkTheme : lightTheme,
  sidebar: { showRoots: true },
});
