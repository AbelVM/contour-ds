import { expect } from "storybook/test";
import "../dist/wc/content.mjs";
import "../dist/wc/dashboard.mjs";
import "../dist/wc/data.mjs";
import "../dist/wc/docs.mjs";
import "../dist/wc/feedback.mjs";
import "../dist/wc/forms.mjs";
import "../dist/wc/interaction.mjs";
import "../dist/wc/layout.mjs";
import "../dist/wc/map.mjs";
import "../dist/wc/misc.mjs";
import "../dist/wc/navigation.mjs";
import "../dist/wc/registration.mjs";
import "../dist/wc/shadow.mjs";
import "../dist/wc/ui.mjs";
import "../dist/contour.css";
import { applyFixture, fixtureArgs } from "./fixtures.js";
import { controlsForTag } from "./metadata.js";

export default {
  title: "Contour/Elements",
  tags: ["autodocs"],
  parameters: {
    contour: { maturity: "composition" },
    a11y: { test: "todo" },
    issue: "SB-04",
    a11yTodo: {
      owner: "Contour maintainers",
      rootCause: "generated catalogue spans incomplete contexts",
      mitigation: "promote mature elements to focused stories",
      review: "2026-12-01",
    },
  },
};

function makeStory(tag) {
  return {
    args: fixtureArgs(tag),
    argTypes: controlsForTag(tag),
    render: (args) => {
      const element = applyFixture(document.createElement(tag), tag);
      for (const [name, value] of Object.entries(args)) {
        if (value === undefined) continue;
        element.setAttribute(name, String(value));
      }
      return element;
    },
    play: async ({ canvasElement }) => {
      const element = canvasElement.querySelector(tag);
      await expect(element).toBeTruthy();
      if (Object.keys(fixtureArgs(tag)).length) {
        await expect(element.textContent).not.toMatch(/no data/i);
      }
    },
  };
}

// Per-story maturity classification for registered elements.
// Defaults to "complete-widget"; exceptions listed below.
const STORY_MATURITY = {
  // Primitives — simple building blocks with no complex internal state
  "contour-box": "primitive",
  "contour-cluster": "primitive",
  "contour-container": "primitive",
  "contour-divider": "primitive",
  "contour-row": "primitive",
  "contour-scrim": "primitive",
  "contour-stack": "primitive",

  // Composition — container/layout components that compose other elements
  "contour-app": "composition",
  "contour-app-body": "composition",
  "contour-dash-shell": "composition",
  "contour-dash-toolbar": "composition",
  "contour-dash-kpi-row": "composition",
  "contour-docs-shell": "composition",
  "contour-docs-nav": "composition",
  "contour-footer": "composition",
  "contour-header": "composition",
  "contour-sidebar": "composition",
  "contour-side-sheet": "composition",
  "contour-theme-scope": "composition",

  // Scaffold — structural/utility components
  "contour-brownout": "scaffold",
  "contour-empty": "scaffold",
  "contour-error-boundary": "scaffold",
  "contour-loading": "scaffold",
  "contour-reserved": "scaffold",
  "contour-skeleton": "scaffold",
  "contour-skeleton-group": "scaffold",
  "contour-widget-state": "scaffold",
};

export const Accordion = Object.assign(makeStory("contour-accordion"), { maturity: "complete-widget" });
export const AccordionPlayground = Object.assign(makeStory("contour-accordion"), { maturity: "complete-widget" });
export const Activity = Object.assign(makeStory("contour-activity"), { maturity: "complete-widget" });
export const ActivityPlayground = Object.assign(makeStory("contour-activity"), { maturity: "complete-widget" });
export const Advanced = Object.assign(makeStory("contour-advanced"), { maturity: "complete-widget" });
export const AdvancedPlayground = Object.assign(makeStory("contour-advanced"), { maturity: "complete-widget" });
export const Affordance = Object.assign(makeStory("contour-affordance"), { maturity: "complete-widget" });
export const AffordancePlayground = Object.assign(makeStory("contour-affordance"), { maturity: "complete-widget" });
export const Affordances = Object.assign(makeStory("contour-affordances"), { maturity: "complete-widget" });
export const AffordancesPlayground = Object.assign(makeStory("contour-affordances"), { maturity: "complete-widget" });
export const Alert = Object.assign(makeStory("contour-alert"), { maturity: "complete-widget" });
export const AlertPlayground = Object.assign(makeStory("contour-alert"), { maturity: "complete-widget" });
export const Anchor = Object.assign(makeStory("contour-anchor"), { maturity: "complete-widget" });
export const AnchorPlayground = Object.assign(makeStory("contour-anchor"), { maturity: "complete-widget" });
export const AnimationControls = Object.assign(makeStory("contour-animation-controls"), { maturity: "complete-widget" });
export const AnimationControlsPlayground = Object.assign(makeStory("contour-animation-controls"), { maturity: "complete-widget" });
export const Annotation = Object.assign(makeStory("contour-annotation"), { maturity: "complete-widget" });
export const AnnotationPlayground = Object.assign(makeStory("contour-annotation"), { maturity: "complete-widget" });
export const App = Object.assign(makeStory("contour-app"), { maturity: "composition" });
export const AppPlayground = Object.assign(makeStory("contour-app"), { maturity: "composition" });
export const AppBody = Object.assign(makeStory("contour-app-body"), { maturity: "composition" });
export const AppBodyPlayground = Object.assign(makeStory("contour-app-body"), { maturity: "composition" });
export const Avatar = Object.assign(makeStory("contour-avatar"), { maturity: "complete-widget" });
export const AvatarPlayground = Object.assign(makeStory("contour-avatar"), { maturity: "complete-widget" });
export const AvatarGroup = Object.assign(makeStory("contour-avatar-group"), { maturity: "complete-widget" });
export const AvatarGroupPlayground = Object.assign(makeStory("contour-avatar-group"), { maturity: "complete-widget" });
export const Axis = Object.assign(makeStory("contour-axis"), { maturity: "complete-widget" });
export const AxisPlayground = Object.assign(makeStory("contour-axis"), { maturity: "complete-widget" });
export const Badge = Object.assign(makeStory("contour-badge"), { maturity: "complete-widget" });
export const BadgePlayground = Object.assign(makeStory("contour-badge"), { maturity: "complete-widget" });
export const BadgeOverflow = Object.assign(makeStory("contour-badge-overflow"), { maturity: "complete-widget" });
export const BadgeOverflowPlayground = Object.assign(makeStory("contour-badge-overflow"), { maturity: "complete-widget" });
export const Banner = Object.assign(makeStory("contour-banner"), { maturity: "complete-widget" });
export const BannerPlayground = Object.assign(makeStory("contour-banner"), { maturity: "complete-widget" });
export const Bivariate = Object.assign(makeStory("contour-bivariate"), { maturity: "complete-widget" });
export const BivariatePlayground = Object.assign(makeStory("contour-bivariate"), { maturity: "complete-widget" });
export const BivariateLegend = Object.assign(makeStory("contour-bivariate-legend"), { maturity: "complete-widget" });
export const BivariateLegendPlayground = Object.assign(makeStory("contour-bivariate-legend"), { maturity: "complete-widget" });
export const Box = Object.assign(makeStory("contour-box"), { maturity: "primitive" });
export const BoxPlayground = Object.assign(makeStory("contour-box"), { maturity: "primitive" });
export const Brand = Object.assign(makeStory("contour-brand"), { maturity: "complete-widget" });
export const BrandPlayground = Object.assign(makeStory("contour-brand"), { maturity: "complete-widget" });
export const Breadcrumb = Object.assign(makeStory("contour-breadcrumb"), { maturity: "complete-widget" });
export const BreadcrumbPlayground = Object.assign(makeStory("contour-breadcrumb"), { maturity: "complete-widget" });
export const Brownout = Object.assign(makeStory("contour-brownout"), { maturity: "scaffold" });
export const BrownoutPlayground = Object.assign(makeStory("contour-brownout"), { maturity: "scaffold" });
export const Brush = Object.assign(makeStory("contour-brush"), { maturity: "complete-widget" });
export const BrushPlayground = Object.assign(makeStory("contour-brush"), { maturity: "complete-widget" });
export const Btn = Object.assign(makeStory("contour-btn"), { maturity: "complete-widget" });
export const BtnPlayground = Object.assign(makeStory("contour-btn"), { maturity: "complete-widget" });
export const BtnGroup = Object.assign(makeStory("contour-btn-group"), { maturity: "complete-widget" });
export const BtnGroupPlayground = Object.assign(makeStory("contour-btn-group"), { maturity: "complete-widget" });
export const Calendar = Object.assign(makeStory("contour-calendar"), { maturity: "complete-widget" });
export const CalendarPlayground = Object.assign(makeStory("contour-calendar"), { maturity: "complete-widget" });
export const Callout = Object.assign(makeStory("contour-callout"), { maturity: "complete-widget" });
export const CalloutPlayground = Object.assign(makeStory("contour-callout"), { maturity: "complete-widget" });
export const Card = Object.assign(makeStory("contour-card"), { maturity: "complete-widget" });
export const CardPlayground = Object.assign(makeStory("contour-card"), { maturity: "complete-widget" });
export const Carousel = Object.assign(makeStory("contour-carousel"), { maturity: "complete-widget" });
export const CarouselPlayground = Object.assign(makeStory("contour-carousel"), { maturity: "complete-widget" });
export const Catchment = Object.assign(makeStory("contour-catchment"), { maturity: "complete-widget" });
export const CatchmentPlayground = Object.assign(makeStory("contour-catchment"), { maturity: "complete-widget" });
export const Category = Object.assign(makeStory("contour-category"), { maturity: "complete-widget" });
export const CategoryPlayground = Object.assign(makeStory("contour-category"), { maturity: "complete-widget" });
export const Changelog = Object.assign(makeStory("contour-changelog"), { maturity: "complete-widget" });
export const ChangelogPlayground = Object.assign(makeStory("contour-changelog"), { maturity: "complete-widget" });
export const Chart = Object.assign(makeStory("contour-chart"), { maturity: "complete-widget" });
export const ChartPlayground = Object.assign(makeStory("contour-chart"), { maturity: "complete-widget" });
export const ChartGrid = Object.assign(makeStory("contour-chart-grid"), { maturity: "complete-widget" });
export const ChartGridPlayground = Object.assign(makeStory("contour-chart-grid"), { maturity: "complete-widget" });
export const Check = Object.assign(makeStory("contour-check"), { maturity: "complete-widget" });
export const CheckPlayground = Object.assign(makeStory("contour-check"), { maturity: "complete-widget" });
export const Chip = Object.assign(makeStory("contour-chip"), { maturity: "complete-widget" });
export const ChipPlayground = Object.assign(makeStory("contour-chip"), { maturity: "complete-widget" });
export const Cluster = Object.assign(makeStory("contour-cluster"), { maturity: "primitive" });
export const ClusterPlayground = Object.assign(makeStory("contour-cluster"), { maturity: "primitive" });
export const Code = Object.assign(makeStory("contour-code"), { maturity: "complete-widget" });
export const CodePlayground = Object.assign(makeStory("contour-code"), { maturity: "complete-widget" });
export const CodeTabs = Object.assign(makeStory("contour-code-tabs"), { maturity: "complete-widget" });
export const CodeTabsPlayground = Object.assign(makeStory("contour-code-tabs"), { maturity: "complete-widget" });
export const ColorPicker = Object.assign(makeStory("contour-color-picker"), { maturity: "complete-widget" });
export const ColorPickerPlayground = Object.assign(makeStory("contour-color-picker"), { maturity: "complete-widget" });
export const Combobox = Object.assign(makeStory("contour-combobox"), { maturity: "complete-widget" });
export const ComboboxPlayground = Object.assign(makeStory("contour-combobox"), { maturity: "complete-widget" });
export const Command = Object.assign(makeStory("contour-command"), { maturity: "complete-widget" });
export const CommandPlayground = Object.assign(makeStory("contour-command"), { maturity: "complete-widget" });
export const CommandPalette = Object.assign(makeStory("contour-command-palette"), { maturity: "complete-widget" });
export const CommandPalettePlayground = Object.assign(makeStory("contour-command-palette"), { maturity: "complete-widget" });
export const Compare = Object.assign(makeStory("contour-compare"), { maturity: "complete-widget" });
export const ComparePlayground = Object.assign(makeStory("contour-compare"), { maturity: "complete-widget" });
export const Comparison = Object.assign(makeStory("contour-comparison"), { maturity: "complete-widget" });
export const ComparisonPlayground = Object.assign(makeStory("contour-comparison"), { maturity: "complete-widget" });
export const Compass = Object.assign(makeStory("contour-compass"), { maturity: "complete-widget" });
export const CompassPlayground = Object.assign(makeStory("contour-compass"), { maturity: "complete-widget" });
export const Container = Object.assign(makeStory("contour-container"), { maturity: "primitive" });
export const ContainerPlayground = Object.assign(makeStory("contour-container"), { maturity: "primitive" });
export const ContextMenu = Object.assign(makeStory("contour-context-menu"), { maturity: "complete-widget" });
export const ContextMenuPlayground = Object.assign(makeStory("contour-context-menu"), { maturity: "complete-widget" });
export const Coordinate = Object.assign(makeStory("contour-coordinate"), { maturity: "complete-widget" });
export const CoordinatePlayground = Object.assign(makeStory("contour-coordinate"), { maturity: "complete-widget" });
export const Cta = Object.assign(makeStory("contour-cta"), { maturity: "complete-widget" });
export const CtaPlayground = Object.assign(makeStory("contour-cta"), { maturity: "complete-widget" });
export const DashFreshness = Object.assign(makeStory("contour-dash-freshness"), { maturity: "complete-widget" });
export const DashFreshnessPlayground = Object.assign(makeStory("contour-dash-freshness"), { maturity: "complete-widget" });
export const DashKpiRow = Object.assign(makeStory("contour-dash-kpi-row"), { maturity: "composition" });
export const DashKpiRowPlayground = Object.assign(makeStory("contour-dash-kpi-row"), { maturity: "composition" });
export const DashShell = Object.assign(makeStory("contour-dash-shell"), { maturity: "composition" });
export const DashShellPlayground = Object.assign(makeStory("contour-dash-shell"), { maturity: "composition" });
export const DashToolbar = Object.assign(makeStory("contour-dash-toolbar"), { maturity: "composition" });
export const DashToolbarPlayground = Object.assign(makeStory("contour-dash-toolbar"), { maturity: "composition" });
export const DataExport = Object.assign(makeStory("contour-data-export"), { maturity: "complete-widget" });
export const DataExportPlayground = Object.assign(makeStory("contour-data-export"), { maturity: "complete-widget" });
export const DataGrid = Object.assign(makeStory("contour-data-grid"), { maturity: "complete-widget" });
export const DataGridPlayground = Object.assign(makeStory("contour-data-grid"), { maturity: "complete-widget" });
export const DataTable = Object.assign(makeStory("contour-data-table"), { maturity: "complete-widget" });
export const DataTablePlayground = Object.assign(makeStory("contour-data-table"), { maturity: "complete-widget" });
export const Datamark = Object.assign(makeStory("contour-datamark"), { maturity: "complete-widget" });
export const DatamarkPlayground = Object.assign(makeStory("contour-datamark"), { maturity: "complete-widget" });
export const DatePicker = Object.assign(makeStory("contour-date-picker"), { maturity: "complete-widget" });
export const DatePickerPlayground = Object.assign(makeStory("contour-date-picker"), { maturity: "complete-widget" });
export const DateRange = Object.assign(makeStory("contour-date-range"), { maturity: "complete-widget" });
export const DateRangePlayground = Object.assign(makeStory("contour-date-range"), { maturity: "complete-widget" });
export const Delta = Object.assign(makeStory("contour-delta"), { maturity: "complete-widget" });
export const DeltaPlayground = Object.assign(makeStory("contour-delta"), { maturity: "complete-widget" });
export const DestructiveHint = Object.assign(makeStory("contour-destructive-hint"), { maturity: "complete-widget" });
export const DestructiveHintPlayground = Object.assign(makeStory("contour-destructive-hint"), { maturity: "complete-widget" });
export const Dialog = Object.assign(makeStory("contour-dialog"), { maturity: "complete-widget" });
export const DialogPlayground = Object.assign(makeStory("contour-dialog"), { maturity: "complete-widget" });
export const Diff = Object.assign(makeStory("contour-diff"), { maturity: "complete-widget" });
export const DiffPlayground = Object.assign(makeStory("contour-diff"), { maturity: "complete-widget" });
export const Disclosure = Object.assign(makeStory("contour-disclosure"), { maturity: "complete-widget" });
export const DisclosurePlayground = Object.assign(makeStory("contour-disclosure"), { maturity: "complete-widget" });
export const Divider = Object.assign(makeStory("contour-divider"), { maturity: "primitive" });
export const DividerPlayground = Object.assign(makeStory("contour-divider"), { maturity: "primitive" });
export const DoDont = Object.assign(makeStory("contour-do-dont"), { maturity: "complete-widget" });
export const DoDontPlayground = Object.assign(makeStory("contour-do-dont"), { maturity: "complete-widget" });
export const DocsNav = Object.assign(makeStory("contour-docs-nav"), { maturity: "composition" });
export const DocsNavPlayground = Object.assign(makeStory("contour-docs-nav"), { maturity: "composition" });
export const DocsShell = Object.assign(makeStory("contour-docs-shell"), { maturity: "composition" });
export const DocsShellPlayground = Object.assign(makeStory("contour-docs-shell"), { maturity: "composition" });
export const Donut = Object.assign(makeStory("contour-donut"), { maturity: "complete-widget" });
export const DonutPlayground = Object.assign(makeStory("contour-donut"), { maturity: "complete-widget" });
export const Dot = Object.assign(makeStory("contour-dot"), { maturity: "complete-widget" });
export const DotPlayground = Object.assign(makeStory("contour-dot"), { maturity: "complete-widget" });
export const DragHandle = Object.assign(makeStory("contour-drag-handle"), { maturity: "complete-widget" });
export const DragHandlePlayground = Object.assign(makeStory("contour-drag-handle"), { maturity: "complete-widget" });
export const Draggable = Object.assign(makeStory("contour-draggable"), { maturity: "complete-widget" });
export const DraggablePlayground = Object.assign(makeStory("contour-draggable"), { maturity: "complete-widget" });
export const Drawer = Object.assign(makeStory("contour-drawer"), { maturity: "complete-widget" });
export const DrawerPlayground = Object.assign(makeStory("contour-drawer"), { maturity: "complete-widget" });
export const DropIndicator = Object.assign(makeStory("contour-drop-indicator"), { maturity: "complete-widget" });
export const DropIndicatorPlayground = Object.assign(makeStory("contour-drop-indicator"), { maturity: "complete-widget" });
export const DropZone = Object.assign(makeStory("contour-drop-zone"), { maturity: "complete-widget" });
export const DropZonePlayground = Object.assign(makeStory("contour-drop-zone"), { maturity: "complete-widget" });
export const Dropdown = Object.assign(makeStory("contour-dropdown"), { maturity: "complete-widget" });
export const DropdownPlayground = Object.assign(makeStory("contour-dropdown"), { maturity: "complete-widget" });
export const Elevation = Object.assign(makeStory("contour-elevation"), { maturity: "complete-widget" });
export const ElevationPlayground = Object.assign(makeStory("contour-elevation"), { maturity: "complete-widget" });
export const Empty = Object.assign(makeStory("contour-empty"), { maturity: "scaffold" });
export const EmptyPlayground = Object.assign(makeStory("contour-empty"), { maturity: "scaffold" });
export const ErrorBoundary = Object.assign(makeStory("contour-error-boundary"), { maturity: "scaffold" });
export const ErrorBoundaryPlayground = Object.assign(makeStory("contour-error-boundary"), { maturity: "scaffold" });
export const Expandable = Object.assign(makeStory("contour-expandable"), { maturity: "complete-widget" });
export const ExpandablePlayground = Object.assign(makeStory("contour-expandable"), { maturity: "complete-widget" });
export const Fab = Object.assign(makeStory("contour-fab"), { maturity: "complete-widget" });
export const FabPlayground = Object.assign(makeStory("contour-fab"), { maturity: "complete-widget" });
export const Faq = Object.assign(makeStory("contour-faq"), { maturity: "complete-widget" });
export const FaqPlayground = Object.assign(makeStory("contour-faq"), { maturity: "complete-widget" });
export const Feature = Object.assign(makeStory("contour-feature"), { maturity: "complete-widget" });
export const FeaturePlayground = Object.assign(makeStory("contour-feature"), { maturity: "complete-widget" });
export const Field = Object.assign(makeStory("contour-field"), { maturity: "complete-widget" });
export const FieldPlayground = Object.assign(makeStory("contour-field"), { maturity: "complete-widget" });
export const FieldGroup = Object.assign(makeStory("contour-field-group"), { maturity: "complete-widget" });
export const FieldGroupPlayground = Object.assign(makeStory("contour-field-group"), { maturity: "complete-widget" });
export const FileTree = Object.assign(makeStory("contour-file-tree"), { maturity: "complete-widget" });
export const FileTreePlayground = Object.assign(makeStory("contour-file-tree"), { maturity: "complete-widget" });
export const FileUpload = Object.assign(makeStory("contour-file-upload"), { maturity: "complete-widget" });
export const FileUploadPlayground = Object.assign(makeStory("contour-file-upload"), { maturity: "complete-widget" });
export const FilterBar = Object.assign(makeStory("contour-filter-bar"), { maturity: "complete-widget" });
export const FilterBarPlayground = Object.assign(makeStory("contour-filter-bar"), { maturity: "complete-widget" });
export const FilterPill = Object.assign(makeStory("contour-filter-pill"), { maturity: "complete-widget" });
export const FilterPillPlayground = Object.assign(makeStory("contour-filter-pill"), { maturity: "complete-widget" });
export const Flag = Object.assign(makeStory("contour-flag"), { maturity: "complete-widget" });
export const FlagPlayground = Object.assign(makeStory("contour-flag"), { maturity: "complete-widget" });
export const FlowMap = Object.assign(makeStory("contour-flow-map"), { maturity: "complete-widget" });
export const FlowMapPlayground = Object.assign(makeStory("contour-flow-map"), { maturity: "complete-widget" });
export const Footer = Object.assign(makeStory("contour-footer"), { maturity: "composition" });
export const FooterPlayground = Object.assign(makeStory("contour-footer"), { maturity: "composition" });
export const Form = Object.assign(makeStory("contour-form"), { maturity: "complete-widget" });
export const FormPlayground = Object.assign(makeStory("contour-form"), { maturity: "complete-widget" });
export const Gauge = Object.assign(makeStory("contour-gauge"), { maturity: "complete-widget" });
export const GaugePlayground = Object.assign(makeStory("contour-gauge"), { maturity: "complete-widget" });
export const Geocoder = Object.assign(makeStory("contour-geocoder"), { maturity: "complete-widget" });
export const GeocoderPlayground = Object.assign(makeStory("contour-geocoder"), { maturity: "complete-widget" });
export const Header = Object.assign(makeStory("contour-header"), { maturity: "composition" });
export const HeaderPlayground = Object.assign(makeStory("contour-header"), { maturity: "composition" });
export const Heatmap = Object.assign(makeStory("contour-heatmap"), { maturity: "complete-widget" });
export const HeatmapPlayground = Object.assign(makeStory("contour-heatmap"), { maturity: "complete-widget" });
export const Hexbin = Object.assign(makeStory("contour-hexbin"), { maturity: "complete-widget" });
export const HexbinPlayground = Object.assign(makeStory("contour-hexbin"), { maturity: "complete-widget" });
export const HoverCard = Object.assign(makeStory("contour-hover-card"), { maturity: "complete-widget" });
export const HoverCardPlayground = Object.assign(makeStory("contour-hover-card"), { maturity: "complete-widget" });
export const IconBadge = Object.assign(makeStory("contour-icon-badge"), { maturity: "complete-widget" });
export const IconBadgePlayground = Object.assign(makeStory("contour-icon-badge"), { maturity: "complete-widget" });
export const Input = Object.assign(makeStory("contour-input"), { maturity: "complete-widget" });
export const InputPlayground = Object.assign(makeStory("contour-input"), { maturity: "complete-widget" });
export const InputGroup = Object.assign(makeStory("contour-input-group"), { maturity: "complete-widget" });
export const InputGroupPlayground = Object.assign(makeStory("contour-input-group"), { maturity: "complete-widget" });
export const Install = Object.assign(makeStory("contour-install"), { maturity: "complete-widget" });
export const InstallPlayground = Object.assign(makeStory("contour-install"), { maturity: "complete-widget" });
export const Instrument = Object.assign(makeStory("contour-instrument"), { maturity: "complete-widget" });
export const InstrumentPlayground = Object.assign(makeStory("contour-instrument"), { maturity: "complete-widget" });
export const Isochrone = Object.assign(makeStory("contour-isochrone"), { maturity: "complete-widget" });
export const IsochronePlayground = Object.assign(makeStory("contour-isochrone"), { maturity: "complete-widget" });
export const Kbd = Object.assign(makeStory("contour-kbd"), { maturity: "complete-widget" });
export const KbdPlayground = Object.assign(makeStory("contour-kbd"), { maturity: "complete-widget" });
export const Kpi = Object.assign(makeStory("contour-kpi"), { maturity: "complete-widget" });
export const KpiPlayground = Object.assign(makeStory("contour-kpi"), { maturity: "complete-widget" });
export const LandingFeatures = Object.assign(makeStory("contour-landing-features"), { maturity: "complete-widget" });
export const LandingFeaturesPlayground = Object.assign(makeStory("contour-landing-features"), { maturity: "complete-widget" });
export const LandingHero = Object.assign(makeStory("contour-landing-hero"), { maturity: "complete-widget" });
export const LandingHeroPlayground = Object.assign(makeStory("contour-landing-hero"), { maturity: "complete-widget" });
export const LayerPanel = Object.assign(makeStory("contour-layer-panel"), { maturity: "complete-widget" });
export const LayerPanelPlayground = Object.assign(makeStory("contour-layer-panel"), { maturity: "complete-widget" });
export const LayerSwitch = Object.assign(makeStory("contour-layer-switch"), { maturity: "complete-widget" });
export const LayerSwitchPlayground = Object.assign(makeStory("contour-layer-switch"), { maturity: "complete-widget" });
export const Legend = Object.assign(makeStory("contour-legend"), { maturity: "complete-widget" });
export const LegendPlayground = Object.assign(makeStory("contour-legend"), { maturity: "complete-widget" });
export const Link = Object.assign(makeStory("contour-link"), { maturity: "complete-widget" });
export const LinkPlayground = Object.assign(makeStory("contour-link"), { maturity: "complete-widget" });
export const Linkish = Object.assign(makeStory("contour-linkish"), { maturity: "complete-widget" });
export const LinkishPlayground = Object.assign(makeStory("contour-linkish"), { maturity: "complete-widget" });
export const LiveBadge = Object.assign(makeStory("contour-live-badge"), { maturity: "complete-widget" });
export const LiveBadgePlayground = Object.assign(makeStory("contour-live-badge"), { maturity: "complete-widget" });
export const Loading = Object.assign(makeStory("contour-loading"), { maturity: "scaffold" });
export const LoadingPlayground = Object.assign(makeStory("contour-loading"), { maturity: "scaffold" });
export const Logos = Object.assign(makeStory("contour-logos"), { maturity: "complete-widget" });
export const LogosPlayground = Object.assign(makeStory("contour-logos"), { maturity: "complete-widget" });
export const MapArea = Object.assign(makeStory("contour-map-area"), { maturity: "complete-widget" });
export const MapAreaPlayground = Object.assign(makeStory("contour-map-area"), { maturity: "complete-widget" });
export const MapFooter = Object.assign(makeStory("contour-map-footer"), { maturity: "complete-widget" });
export const MapFooterPlayground = Object.assign(makeStory("contour-map-footer"), { maturity: "complete-widget" });
export const MapPanel = Object.assign(makeStory("contour-map-panel"), { maturity: "complete-widget" });
export const MapPanelPlayground = Object.assign(makeStory("contour-map-panel"), { maturity: "complete-widget" });
export const MapPopup = Object.assign(makeStory("contour-map-popup"), { maturity: "complete-widget" });
export const MapPopupPlayground = Object.assign(makeStory("contour-map-popup"), { maturity: "complete-widget" });
export const MapSlot = Object.assign(makeStory("contour-map-slot"), { maturity: "complete-widget" });
export const MapSlotPlayground = Object.assign(makeStory("contour-map-slot"), { maturity: "complete-widget" });
export const Mark = Object.assign(makeStory("contour-mark"), { maturity: "complete-widget" });
export const MarkPlayground = Object.assign(makeStory("contour-mark"), { maturity: "complete-widget" });
export const Measure = Object.assign(makeStory("contour-measure"), { maturity: "complete-widget" });
export const MeasurePlayground = Object.assign(makeStory("contour-measure"), { maturity: "complete-widget" });
export const Menu = Object.assign(makeStory("contour-menu"), { maturity: "complete-widget" });
export const MenuPlayground = Object.assign(makeStory("contour-menu"), { maturity: "complete-widget" });
export const Meter = Object.assign(makeStory("contour-meter"), { maturity: "complete-widget" });
export const MeterPlayground = Object.assign(makeStory("contour-meter"), { maturity: "complete-widget" });
export const Metrics = Object.assign(makeStory("contour-metrics"), { maturity: "complete-widget" });
export const MetricsPlayground = Object.assign(makeStory("contour-metrics"), { maturity: "complete-widget" });
export const Minimap = Object.assign(makeStory("contour-minimap"), { maturity: "complete-widget" });
export const MinimapPlayground = Object.assign(makeStory("contour-minimap"), { maturity: "complete-widget" });
export const NotificationCenter = Object.assign(makeStory("contour-notification-center"), { maturity: "complete-widget" });
export const NotificationCenterPlayground = Object.assign(makeStory("contour-notification-center"), { maturity: "complete-widget" });
export const NumberField = Object.assign(makeStory("contour-number-field"), { maturity: "complete-widget" });
export const NumberFieldPlayground = Object.assign(makeStory("contour-number-field"), { maturity: "complete-widget" });
export const Pager = Object.assign(makeStory("contour-pager"), { maturity: "complete-widget" });
export const PagerPlayground = Object.assign(makeStory("contour-pager"), { maturity: "complete-widget" });
export const Pagination = Object.assign(makeStory("contour-pagination"), { maturity: "complete-widget" });
export const PaginationPlayground = Object.assign(makeStory("contour-pagination"), { maturity: "complete-widget" });
export const PaletteEditor = Object.assign(makeStory("contour-palette-editor"), { maturity: "complete-widget" });
export const PaletteEditorPlayground = Object.assign(makeStory("contour-palette-editor"), { maturity: "complete-widget" });
export const Panel = Object.assign(makeStory("contour-panel"), { maturity: "complete-widget" });
export const PanelPlayground = Object.assign(makeStory("contour-panel"), { maturity: "complete-widget" });
export const Pill = Object.assign(makeStory("contour-pill"), { maturity: "complete-widget" });
export const PillPlayground = Object.assign(makeStory("contour-pill"), { maturity: "complete-widget" });
export const Pivot = Object.assign(makeStory("contour-pivot"), { maturity: "complete-widget" });
export const PivotPlayground = Object.assign(makeStory("contour-pivot"), { maturity: "complete-widget" });
export const Plate = Object.assign(makeStory("contour-plate"), { maturity: "complete-widget" });
export const PlatePlayground = Object.assign(makeStory("contour-plate"), { maturity: "complete-widget" });
export const Popover = Object.assign(makeStory("contour-popover"), { maturity: "complete-widget" });
export const PopoverPlayground = Object.assign(makeStory("contour-popover"), { maturity: "complete-widget" });
export const Pressable = Object.assign(makeStory("contour-pressable"), { maturity: "complete-widget" });
export const PressablePlayground = Object.assign(makeStory("contour-pressable"), { maturity: "complete-widget" });
export const Price = Object.assign(makeStory("contour-price"), { maturity: "complete-widget" });
export const PricePlayground = Object.assign(makeStory("contour-price"), { maturity: "complete-widget" });
export const Pricing = Object.assign(makeStory("contour-pricing"), { maturity: "complete-widget" });
export const PricingPlayground = Object.assign(makeStory("contour-pricing"), { maturity: "complete-widget" });
export const Progress = Object.assign(makeStory("contour-progress"), { maturity: "complete-widget" });
export const ProgressPlayground = Object.assign(makeStory("contour-progress"), { maturity: "complete-widget" });
export const Prose = Object.assign(makeStory("contour-prose"), { maturity: "complete-widget" });
export const ProsePlayground = Object.assign(makeStory("contour-prose"), { maturity: "complete-widget" });
export const PullToRefresh = Object.assign(makeStory("contour-pull-to-refresh"), { maturity: "complete-widget" });
export const PullToRefreshPlayground = Object.assign(makeStory("contour-pull-to-refresh"), { maturity: "complete-widget" });
export const Pullquote = Object.assign(makeStory("contour-pullquote"), { maturity: "complete-widget" });
export const PullquotePlayground = Object.assign(makeStory("contour-pullquote"), { maturity: "complete-widget" });
export const Radio = Object.assign(makeStory("contour-radio"), { maturity: "complete-widget" });
export const RadioPlayground = Object.assign(makeStory("contour-radio"), { maturity: "complete-widget" });
export const RadioList = Object.assign(makeStory("contour-radio-list"), { maturity: "complete-widget" });
export const RadioListPlayground = Object.assign(makeStory("contour-radio-list"), { maturity: "complete-widget" });
export const Range = Object.assign(makeStory("contour-range"), { maturity: "complete-widget" });
export const RangePlayground = Object.assign(makeStory("contour-range"), { maturity: "complete-widget" });
export const RangeScale = Object.assign(makeStory("contour-range-scale"), { maturity: "complete-widget" });
export const RangeScalePlayground = Object.assign(makeStory("contour-range-scale"), { maturity: "complete-widget" });
export const Rating = Object.assign(makeStory("contour-rating"), { maturity: "complete-widget" });
export const RatingPlayground = Object.assign(makeStory("contour-rating"), { maturity: "complete-widget" });
export const Readout = Object.assign(makeStory("contour-readout"), { maturity: "complete-widget" });
export const ReadoutPlayground = Object.assign(makeStory("contour-readout"), { maturity: "complete-widget" });
export const Recipe = Object.assign(makeStory("contour-recipe"), { maturity: "complete-widget" });
export const RecipePlayground = Object.assign(makeStory("contour-recipe"), { maturity: "complete-widget" });
export const Reserved = Object.assign(makeStory("contour-reserved"), { maturity: "scaffold" });
export const ReservedPlayground = Object.assign(makeStory("contour-reserved"), { maturity: "scaffold" });
export const Resizable = Object.assign(makeStory("contour-resizable"), { maturity: "complete-widget" });
export const ResizablePlayground = Object.assign(makeStory("contour-resizable"), { maturity: "complete-widget" });
export const ResizeHandle = Object.assign(makeStory("contour-resize-handle"), { maturity: "complete-widget" });
export const ResizeHandlePlayground = Object.assign(makeStory("contour-resize-handle"), { maturity: "complete-widget" });
export const ResizeObserver = Object.assign(makeStory("contour-resize-observer"), { maturity: "complete-widget" });
export const ResizeObserverPlayground = Object.assign(makeStory("contour-resize-observer"), { maturity: "complete-widget" });
export const ResponsiveContent = Object.assign(makeStory("contour-responsive-content"), { maturity: "complete-widget" });
export const ResponsiveContentPlayground = Object.assign(makeStory("contour-responsive-content"), { maturity: "complete-widget" });
export const Row = Object.assign(makeStory("contour-row"), { maturity: "primitive" });
export const RowPlayground = Object.assign(makeStory("contour-row"), { maturity: "primitive" });
export const RowAction = Object.assign(makeStory("contour-row-action"), { maturity: "complete-widget" });
export const RowActionPlayground = Object.assign(makeStory("contour-row-action"), { maturity: "complete-widget" });
export const ScaleBar = Object.assign(makeStory("contour-scale-bar"), { maturity: "complete-widget" });
export const ScaleBarPlayground = Object.assign(makeStory("contour-scale-bar"), { maturity: "complete-widget" });
export const SchemeToggle = Object.assign(makeStory("contour-scheme-toggle"), { maturity: "complete-widget" });
export const SchemeTogglePlayground = Object.assign(makeStory("contour-scheme-toggle"), { maturity: "complete-widget" });
export const Scrim = Object.assign(makeStory("contour-scrim"), { maturity: "primitive" });
export const ScrimPlayground = Object.assign(makeStory("contour-scrim"), { maturity: "primitive" });
export const ScrollArea = Object.assign(makeStory("contour-scroll-area"), { maturity: "complete-widget" });
export const ScrollAreaPlayground = Object.assign(makeStory("contour-scroll-area"), { maturity: "complete-widget" });
export const SearchTrigger = Object.assign(makeStory("contour-search-trigger"), { maturity: "complete-widget" });
export const SearchTriggerPlayground = Object.assign(makeStory("contour-search-trigger"), { maturity: "complete-widget" });
export const SectionHead = Object.assign(makeStory("contour-section-head"), { maturity: "complete-widget" });
export const SectionHeadPlayground = Object.assign(makeStory("contour-section-head"), { maturity: "complete-widget" });
export const Segmented = Object.assign(makeStory("contour-segmented"), { maturity: "complete-widget" });
export const SegmentedPlayground = Object.assign(makeStory("contour-segmented"), { maturity: "complete-widget" });
export const Select = Object.assign(makeStory("contour-select"), { maturity: "complete-widget" });
export const SelectPlayground = Object.assign(makeStory("contour-select"), { maturity: "complete-widget" });
export const ShadowDialog = Object.assign(makeStory("contour-shadow-dialog"), { maturity: "complete-widget" });
export const ShadowDialogPlayground = Object.assign(makeStory("contour-shadow-dialog"), { maturity: "complete-widget" });
export const Sheet = Object.assign(makeStory("contour-sheet"), { maturity: "complete-widget" });
export const SheetPlayground = Object.assign(makeStory("contour-sheet"), { maturity: "complete-widget" });
export const Shortcut = Object.assign(makeStory("contour-shortcut"), { maturity: "complete-widget" });
export const ShortcutPlayground = Object.assign(makeStory("contour-shortcut"), { maturity: "complete-widget" });
export const ShortcutList = Object.assign(makeStory("contour-shortcut-list"), { maturity: "complete-widget" });
export const ShortcutListPlayground = Object.assign(makeStory("contour-shortcut-list"), { maturity: "complete-widget" });
export const ShortcutOverlay = Object.assign(makeStory("contour-shortcut-overlay"), { maturity: "complete-widget" });
export const ShortcutOverlayPlayground = Object.assign(makeStory("contour-shortcut-overlay"), { maturity: "complete-widget" });
export const ShortcutPanel = Object.assign(makeStory("contour-shortcut-panel"), { maturity: "complete-widget" });
export const ShortcutPanelPlayground = Object.assign(makeStory("contour-shortcut-panel"), { maturity: "complete-widget" });
export const ShortcutRow = Object.assign(makeStory("contour-shortcut-row"), { maturity: "complete-widget" });
export const ShortcutRowPlayground = Object.assign(makeStory("contour-shortcut-row"), { maturity: "complete-widget" });
export const Showcase = Object.assign(makeStory("contour-showcase"), { maturity: "complete-widget" });
export const ShowcasePlayground = Object.assign(makeStory("contour-showcase"), { maturity: "complete-widget" });
export const SideSheet = Object.assign(makeStory("contour-side-sheet"), { maturity: "composition" });
export const SideSheetPlayground = Object.assign(makeStory("contour-side-sheet"), { maturity: "composition" });
export const Sidebar = Object.assign(makeStory("contour-sidebar"), { maturity: "composition" });
export const SidebarPlayground = Object.assign(makeStory("contour-sidebar"), { maturity: "composition" });
export const Skeleton = Object.assign(makeStory("contour-skeleton"), { maturity: "scaffold" });
export const SkeletonPlayground = Object.assign(makeStory("contour-skeleton"), { maturity: "scaffold" });
export const SkeletonGroup = Object.assign(makeStory("contour-skeleton-group"), { maturity: "scaffold" });
export const SkeletonGroupPlayground = Object.assign(makeStory("contour-skeleton-group"), { maturity: "scaffold" });
export const SortableList = Object.assign(makeStory("contour-sortable-list"), { maturity: "complete-widget" });
export const SortableListPlayground = Object.assign(makeStory("contour-sortable-list"), { maturity: "complete-widget" });
export const Sparkline = Object.assign(makeStory("contour-sparkline"), { maturity: "complete-widget" });
export const SparklinePlayground = Object.assign(makeStory("contour-sparkline"), { maturity: "complete-widget" });
export const SpatialFilter = Object.assign(makeStory("contour-spatial-filter"), { maturity: "complete-widget" });
export const SpatialFilterPlayground = Object.assign(makeStory("contour-spatial-filter"), { maturity: "complete-widget" });
export const Spinner = Object.assign(makeStory("contour-spinner"), { maturity: "complete-widget" });
export const SpinnerPlayground = Object.assign(makeStory("contour-spinner"), { maturity: "complete-widget" });
export const SplitButton = Object.assign(makeStory("contour-split-button"), { maturity: "complete-widget" });
export const SplitButtonPlayground = Object.assign(makeStory("contour-split-button"), { maturity: "complete-widget" });
export const SplitMap = Object.assign(makeStory("contour-split-map"), { maturity: "complete-widget" });
export const SplitMapPlayground = Object.assign(makeStory("contour-split-map"), { maturity: "complete-widget" });
export const Stack = Object.assign(makeStory("contour-stack"), { maturity: "primitive" });
export const StackPlayground = Object.assign(makeStory("contour-stack"), { maturity: "primitive" });
export const StackedBar = Object.assign(makeStory("contour-stacked-bar"), { maturity: "complete-widget" });
export const StackedBarPlayground = Object.assign(makeStory("contour-stacked-bar"), { maturity: "complete-widget" });
export const Stat = Object.assign(makeStory("contour-stat"), { maturity: "complete-widget" });
export const StatPlayground = Object.assign(makeStory("contour-stat"), { maturity: "complete-widget" });
export const StatusLight = Object.assign(makeStory("contour-status-light"), { maturity: "complete-widget" });
export const StatusLightPlayground = Object.assign(makeStory("contour-status-light"), { maturity: "complete-widget" });
export const Stepper = Object.assign(makeStory("contour-stepper"), { maturity: "complete-widget" });
export const StepperPlayground = Object.assign(makeStory("contour-stepper"), { maturity: "complete-widget" });
export const Steps = Object.assign(makeStory("contour-steps"), { maturity: "complete-widget" });
export const StepsPlayground = Object.assign(makeStory("contour-steps"), { maturity: "complete-widget" });
export const StreamingChart = Object.assign(makeStory("contour-streaming-chart"), { maturity: "complete-widget" });
export const StreamingChartPlayground = Object.assign(makeStory("contour-streaming-chart"), { maturity: "complete-widget" });
export const StylePanel = Object.assign(makeStory("contour-style-panel"), { maturity: "complete-widget" });
export const StylePanelPlayground = Object.assign(makeStory("contour-style-panel"), { maturity: "complete-widget" });
export const StyleSwitcher = Object.assign(makeStory("contour-style-switcher"), { maturity: "complete-widget" });
export const StyleSwitcherPlayground = Object.assign(makeStory("contour-style-switcher"), { maturity: "complete-widget" });
export const Survey = Object.assign(makeStory("contour-survey"), { maturity: "complete-widget" });
export const SurveyPlayground = Object.assign(makeStory("contour-survey"), { maturity: "complete-widget" });
export const Swatch = Object.assign(makeStory("contour-swatch"), { maturity: "complete-widget" });
export const SwatchPlayground = Object.assign(makeStory("contour-swatch"), { maturity: "complete-widget" });
export const Switch = Object.assign(makeStory("contour-switch"), { maturity: "complete-widget" });
export const SwitchPlayground = Object.assign(makeStory("contour-switch"), { maturity: "complete-widget" });
export const Table = Object.assign(makeStory("contour-table"), { maturity: "complete-widget" });
export const TablePlayground = Object.assign(makeStory("contour-table"), { maturity: "complete-widget" });
export const TableWrap = Object.assign(makeStory("contour-table-wrap"), { maturity: "complete-widget" });
export const TableWrapPlayground = Object.assign(makeStory("contour-table-wrap"), { maturity: "complete-widget" });
export const Tabs = Object.assign(makeStory("contour-tabs"), { maturity: "complete-widget" });
export const TabsPlayground = Object.assign(makeStory("contour-tabs"), { maturity: "complete-widget" });
export const Tag = Object.assign(makeStory("contour-tag"), { maturity: "complete-widget" });
export const TagPlayground = Object.assign(makeStory("contour-tag"), { maturity: "complete-widget" });
export const TagsInput = Object.assign(makeStory("contour-tags-input"), { maturity: "complete-widget" });
export const TagsInputPlayground = Object.assign(makeStory("contour-tags-input"), { maturity: "complete-widget" });
export const Testimonial = Object.assign(makeStory("contour-testimonial"), { maturity: "complete-widget" });
export const TestimonialPlayground = Object.assign(makeStory("contour-testimonial"), { maturity: "complete-widget" });
export const Textarea = Object.assign(makeStory("contour-textarea"), { maturity: "complete-widget" });
export const TextareaPlayground = Object.assign(makeStory("contour-textarea"), { maturity: "complete-widget" });
export const ThemeScope = Object.assign(makeStory("contour-theme-scope"), { maturity: "composition" });
export const ThemeScopePlayground = Object.assign(makeStory("contour-theme-scope"), { maturity: "composition" });
export const Threshold = Object.assign(makeStory("contour-threshold"), { maturity: "complete-widget" });
export const ThresholdPlayground = Object.assign(makeStory("contour-threshold"), { maturity: "complete-widget" });
export const TimePicker = Object.assign(makeStory("contour-time-picker"), { maturity: "complete-widget" });
export const TimePickerPlayground = Object.assign(makeStory("contour-time-picker"), { maturity: "complete-widget" });
export const TimeRange = Object.assign(makeStory("contour-time-range"), { maturity: "complete-widget" });
export const TimeRangePlayground = Object.assign(makeStory("contour-time-range"), { maturity: "complete-widget" });
export const TimeSeries = Object.assign(makeStory("contour-time-series"), { maturity: "complete-widget" });
export const TimeSeriesPlayground = Object.assign(makeStory("contour-time-series"), { maturity: "complete-widget" });
export const TimeSlider = Object.assign(makeStory("contour-time-slider"), { maturity: "complete-widget" });
export const TimeSliderPlayground = Object.assign(makeStory("contour-time-slider"), { maturity: "complete-widget" });
export const Timeline = Object.assign(makeStory("contour-timeline"), { maturity: "complete-widget" });
export const TimelinePlayground = Object.assign(makeStory("contour-timeline"), { maturity: "complete-widget" });
export const Toast = Object.assign(makeStory("contour-toast"), { maturity: "complete-widget" });
export const ToastPlayground = Object.assign(makeStory("contour-toast"), { maturity: "complete-widget" });
export const ToastHost = Object.assign(makeStory("contour-toast-host"), { maturity: "complete-widget" });
export const ToastHostPlayground = Object.assign(makeStory("contour-toast-host"), { maturity: "complete-widget" });
export const Toc = Object.assign(makeStory("contour-toc"), { maturity: "complete-widget" });
export const TocPlayground = Object.assign(makeStory("contour-toc"), { maturity: "complete-widget" });
export const Toolbar = Object.assign(makeStory("contour-toolbar"), { maturity: "complete-widget" });
export const ToolbarPlayground = Object.assign(makeStory("contour-toolbar"), { maturity: "complete-widget" });
export const Tooltip = Object.assign(makeStory("contour-tooltip"), { maturity: "complete-widget" });
export const TooltipPlayground = Object.assign(makeStory("contour-tooltip"), { maturity: "complete-widget" });
export const Tour = Object.assign(makeStory("contour-tour"), { maturity: "complete-widget" });
export const TourPlayground = Object.assign(makeStory("contour-tour"), { maturity: "complete-widget" });
export const Tree = Object.assign(makeStory("contour-tree"), { maturity: "complete-widget" });
export const TreePlayground = Object.assign(makeStory("contour-tree"), { maturity: "complete-widget" });
export const TreeGrid = Object.assign(makeStory("contour-tree-grid"), { maturity: "complete-widget" });
export const TreeGridPlayground = Object.assign(makeStory("contour-tree-grid"), { maturity: "complete-widget" });
export const Version = Object.assign(makeStory("contour-version"), { maturity: "complete-widget" });
export const VersionPlayground = Object.assign(makeStory("contour-version"), { maturity: "complete-widget" });
export const VersionBanner = Object.assign(makeStory("contour-version-banner"), { maturity: "complete-widget" });
export const VersionBannerPlayground = Object.assign(makeStory("contour-version-banner"), { maturity: "complete-widget" });
export const VirtualList = Object.assign(makeStory("contour-virtual-list"), { maturity: "complete-widget" });
export const VirtualListPlayground = Object.assign(makeStory("contour-virtual-list"), { maturity: "complete-widget" });
export const WidgetState = Object.assign(makeStory("contour-widget-state"), { maturity: "scaffold" });
export const WidgetStatePlayground = Object.assign(makeStory("contour-widget-state"), { maturity: "scaffold" });
