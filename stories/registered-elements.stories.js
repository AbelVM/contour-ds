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
    issue: "SB-04a",
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

export const Accordion = makeStory("contour-accordion");
export const Activity = makeStory("contour-activity");
export const Advanced = makeStory("contour-advanced");
export const Affordance = makeStory("contour-affordance");
export const Affordances = makeStory("contour-affordances");
export const Alert = makeStory("contour-alert");
export const Anchor = makeStory("contour-anchor");
export const AnimationControls = makeStory("contour-animation-controls");
export const Annotation = makeStory("contour-annotation");
export const App = makeStory("contour-app");
export const AppBody = makeStory("contour-app-body");
export const Avatar = makeStory("contour-avatar");
export const AvatarGroup = makeStory("contour-avatar-group");
export const Axis = makeStory("contour-axis");
export const Badge = makeStory("contour-badge");
export const BadgeOverflow = makeStory("contour-badge-overflow");
export const Banner = makeStory("contour-banner");
export const Bivariate = makeStory("contour-bivariate");
export const BivariateLegend = makeStory("contour-bivariate-legend");
export const Brand = makeStory("contour-brand");
export const Breadcrumb = makeStory("contour-breadcrumb");
export const Brownout = makeStory("contour-brownout");
export const Brush = makeStory("contour-brush");
export const Btn = makeStory("contour-btn");
export const BtnGroup = makeStory("contour-btn-group");
export const Calendar = makeStory("contour-calendar");
export const Callout = makeStory("contour-callout");
export const Card = makeStory("contour-card");
export const Carousel = makeStory("contour-carousel");
export const Catchment = makeStory("contour-catchment");
export const Category = makeStory("contour-category");
export const Chart = makeStory("contour-chart");
export const ChartGrid = makeStory("contour-chart-grid");
export const Check = makeStory("contour-check");
export const Chip = makeStory("contour-chip");
export const Code = makeStory("contour-code");
export const CodeTabs = makeStory("contour-code-tabs");
export const ColorPicker = makeStory("contour-color-picker");
export const Combobox = makeStory("contour-combobox");
export const Command = makeStory("contour-command");
export const CommandPalette = makeStory("contour-command-palette");
export const Compare = makeStory("contour-compare");
export const Comparison = makeStory("contour-comparison");
export const Compass = makeStory("contour-compass");
export const ContextMenu = makeStory("contour-context-menu");
export const Coordinate = makeStory("contour-coordinate");
export const Cta = makeStory("contour-cta");
export const DashFreshness = makeStory("contour-dash-freshness");
export const DashKpiRow = makeStory("contour-dash-kpi-row");
export const DashShell = makeStory("contour-dash-shell");
export const DashToolbar = makeStory("contour-dash-toolbar");
export const DataGrid = makeStory("contour-data-grid");
export const DataTable = makeStory("contour-data-table");
export const Datamark = makeStory("contour-datamark");
export const DatePicker = makeStory("contour-date-picker");
export const DateRange = makeStory("contour-date-range");
export const Delta = makeStory("contour-delta");
export const DestructiveHint = makeStory("contour-destructive-hint");
export const Dialog = makeStory("contour-dialog");
export const Diff = makeStory("contour-diff");
export const Disclosure = makeStory("contour-disclosure");
export const Divider = makeStory("contour-divider");
export const DoDont = makeStory("contour-do-dont");
export const DocsNav = makeStory("contour-docs-nav");
export const DocsShell = makeStory("contour-docs-shell");
export const Donut = makeStory("contour-donut");
export const Dot = makeStory("contour-dot");
export const DragHandle = makeStory("contour-drag-handle");
export const Draggable = makeStory("contour-draggable");
export const Drawer = makeStory("contour-drawer");
export const DropIndicator = makeStory("contour-drop-indicator");
export const DropZone = makeStory("contour-drop-zone");
export const Dropdown = makeStory("contour-dropdown");
export const Elevation = makeStory("contour-elevation");
export const Empty = makeStory("contour-empty");
export const ErrorBoundary = makeStory("contour-error-boundary");
export const Expandable = makeStory("contour-expandable");
export const Fab = makeStory("contour-fab");
export const Faq = makeStory("contour-faq");
export const Feature = makeStory("contour-feature");
export const Field = makeStory("contour-field");
export const FieldGroup = makeStory("contour-field-group");
export const Form = makeStory("contour-form");
export const FileTree = makeStory("contour-file-tree");
export const FileUpload = makeStory("contour-file-upload");
export const FilterBar = makeStory("contour-filter-bar");
export const FilterPill = makeStory("contour-filter-pill");
export const Flag = makeStory("contour-flag");
export const FlowMap = makeStory("contour-flow-map");
export const Footer = makeStory("contour-footer");
export const Gauge = makeStory("contour-gauge");
export const Header = makeStory("contour-header");
export const Heatmap = makeStory("contour-heatmap");
export const Hexbin = makeStory("contour-hexbin");
export const HoverCard = makeStory("contour-hover-card");
export const IconBadge = makeStory("contour-icon-badge");
export const Input = makeStory("contour-input");
export const InputGroup = makeStory("contour-input-group");
export const Install = makeStory("contour-install");
export const Instrument = makeStory("contour-instrument");
export const Isochrone = makeStory("contour-isochrone");
export const Kbd = makeStory("contour-kbd");
export const Kpi = makeStory("contour-kpi");
export const LandingFeatures = makeStory("contour-landing-features");
export const LandingHero = makeStory("contour-landing-hero");
export const LayerPanel = makeStory("contour-layer-panel");
export const LayerSwitch = makeStory("contour-layer-switch");
export const Legend = makeStory("contour-legend");
export const Link = makeStory("contour-link");
export const Linkish = makeStory("contour-linkish");
export const LiveBadge = makeStory("contour-live-badge");
export const Loading = makeStory("contour-loading");
export const Logos = makeStory("contour-logos");
export const MapArea = makeStory("contour-map-area");
export const MapFooter = makeStory("contour-map-footer");
export const MapPanel = makeStory("contour-map-panel");
export const MapPopup = makeStory("contour-map-popup");
export const MapSlot = makeStory("contour-map-slot");
export const Mark = makeStory("contour-mark");
export const Measure = makeStory("contour-measure");
export const Menu = makeStory("contour-menu");
export const Meter = makeStory("contour-meter");
export const Metrics = makeStory("contour-metrics");
export const Minimap = makeStory("contour-minimap");
export const NotificationCenter = makeStory("contour-notification-center");
export const NumberField = makeStory("contour-number-field");
export const Pager = makeStory("contour-pager");
export const Pagination = makeStory("contour-pagination");
export const PaletteEditor = makeStory("contour-palette-editor");
export const Panel = makeStory("contour-panel");
export const Pill = makeStory("contour-pill");
export const Pivot = makeStory("contour-pivot");
export const Plate = makeStory("contour-plate");
export const Popover = makeStory("contour-popover");
export const Pressable = makeStory("contour-pressable");
export const Price = makeStory("contour-price");
export const Pricing = makeStory("contour-pricing");
export const Progress = makeStory("contour-progress");
export const Prose = makeStory("contour-prose");
export const Pullquote = makeStory("contour-pullquote");
export const Radio = makeStory("contour-radio");
export const RadioList = makeStory("contour-radio-list");
export const Range = makeStory("contour-range");
export const RangeScale = makeStory("contour-range-scale");
export const Rating = makeStory("contour-rating");
export const Readout = makeStory("contour-readout");
export const Recipe = makeStory("contour-recipe");
export const Reserved = makeStory("contour-reserved");
export const Resizable = makeStory("contour-resizable");
export const ResizeHandle = makeStory("contour-resize-handle");
export const ResizeObserver = makeStory("contour-resize-observer");
export const ResponsiveContent = makeStory("contour-responsive-content");
export const RowAction = makeStory("contour-row-action");
export const ScaleBar = makeStory("contour-scale-bar");
export const SchemeToggle = makeStory("contour-scheme-toggle");
export const ScrollArea = makeStory("contour-scroll-area");
export const SearchTrigger = makeStory("contour-search-trigger");
export const SectionHead = makeStory("contour-section-head");
export const Segmented = makeStory("contour-segmented");
export const Select = makeStory("contour-select");
export const ShadowDialog = makeStory("contour-shadow-dialog");
export const Sheet = makeStory("contour-sheet");
export const Shortcut = makeStory("contour-shortcut");
export const ShortcutList = makeStory("contour-shortcut-list");
export const ShortcutOverlay = makeStory("contour-shortcut-overlay");
export const ShortcutPanel = makeStory("contour-shortcut-panel");
export const ShortcutRow = makeStory("contour-shortcut-row");
export const Showcase = makeStory("contour-showcase");
export const SideSheet = makeStory("contour-side-sheet");
export const Sidebar = makeStory("contour-sidebar");
export const Skeleton = makeStory("contour-skeleton");
export const SkeletonGroup = makeStory("contour-skeleton-group");
export const SortableList = makeStory("contour-sortable-list");
export const Sparkline = makeStory("contour-sparkline");
export const Spinner = makeStory("contour-spinner");
export const SplitButton = makeStory("contour-split-button");
export const StackedBar = makeStory("contour-stacked-bar");
export const Stat = makeStory("contour-stat");
export const StatusLight = makeStory("contour-status-light");
export const Stepper = makeStory("contour-stepper");
export const Steps = makeStory("contour-steps");
export const StreamingChart = makeStory("contour-streaming-chart");
export const StylePanel = makeStory("contour-style-panel");
export const StyleSwitcher = makeStory("contour-style-switcher");
export const Survey = makeStory("contour-survey");
export const Swatch = makeStory("contour-swatch");
export const Switch = makeStory("contour-switch");
export const Table = makeStory("contour-table");
export const TableWrap = makeStory("contour-table-wrap");
export const Tabs = makeStory("contour-tabs");
export const Tag = makeStory("contour-tag");
export const TagsInput = makeStory("contour-tags-input");
export const Testimonial = makeStory("contour-testimonial");
export const Textarea = makeStory("contour-textarea");
export const ThemeScope = makeStory("contour-theme-scope");
export const Threshold = makeStory("contour-threshold");
export const TimePicker = makeStory("contour-time-picker");
export const TimeRange = makeStory("contour-time-range");
export const TimeSeries = makeStory("contour-time-series");
export const TimeSlider = makeStory("contour-time-slider");
export const Timeline = makeStory("contour-timeline");
export const Toast = makeStory("contour-toast");
export const ToastHost = makeStory("contour-toast-host");
export const Toc = makeStory("contour-toc");
export const Toolbar = makeStory("contour-toolbar");
export const Tooltip = makeStory("contour-tooltip");
export const Tour = makeStory("contour-tour");
export const Tree = makeStory("contour-tree");
export const TreeGrid = makeStory("contour-tree-grid");
export const Version = makeStory("contour-version");
export const VersionBanner = makeStory("contour-version-banner");
export const VirtualList = makeStory("contour-virtual-list");
export const WidgetState = makeStory("contour-widget-state");
