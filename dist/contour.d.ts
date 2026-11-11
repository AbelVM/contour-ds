type S=string|null;
export interface ContourAPI{__loaded:true;version:string;toast:(m:string)=>void;setScheme:(s:'dark'|'light')=>void;scrollTo:(id:string|HTMLElement)=>void;copy:(t:string)=>Promise<void>;chart:{scale:(d:[number,number],r:[number,number])=>(v:number)=>number;ticks:(min:number,max:number,c:number)=>number[];datum:(x:number,y:number)=>{x:number;y:number};};commands:{register:(cmd:{title:string;hint?:S;icon?:S;shortcut?:S;run:()=>void})=>void;list:()=>Array<{title:string;hint:S;icon:S;shortcut:S|null}>;};};

export interface ContourProps{action?:S;actions?:S;after?:S;anchor?:S;answer?:S;area?:S;article?:S;attribution?:S;attribution-mark?:S;axis?:S;axis-x?:S;axis-y?:S;before?:S;body?:S;brand?:S;canvas?:S;cells?:S;center?:S;chrome?:S;closable?:S;color?:S;cols?:S;columns?:S;command?:S;controls?:S;copyable?:S;count?:S;current?:S;date?:S;delta?:S;demo?:S;desc?:S;direction?:S;divider?:S;do?:S;dont?:S;dot?:S;empty?:S;error?:S;hint?:S;href?:S;icon?:S;index?:S;instrument?:S;items?:S;key?:S;label?:S;lede?:S;legend?:S;line?:S;links?:S;live?:S;max?:S;media?:S;message?:S;method?:S;min?:S;name?:S;needle?:S;next?:S;no?:S;nodes?:S;norm?:S;note?:S;options?:S;pages?:S;placeholder?:S;point?:S;points?:S;prev?:S;prompt?:S;question?:S;quote?:S;ramp?:S;removable?:S;required?:S;reverse?:S;rings?:S;rows?:S;scale?:S;separator?:S;series?:S;shortcut?:S;size?:S;state?:S;status?:S;steps?:S;subtitle?:S;summary?:S;tabs?:S;tag?:S;text?:S;title?:S;type?:S;unit?:S;value?:S;variant?:S;viewport?:S;yes?:S;}

export interface ContourElement extends HTMLElement,ContourProps{}

export interface ContourFormElement extends ContourElement{value?:S;checked?:boolean;disabled?:boolean;required?:boolean;name?:S;placeholder?:S;min?:S;max?:S;step?:S;}

export interface ContourDataElement extends ContourElement{data?:S;series?:S;src?:S;loading?:S;error?:S;empty?:S;skeleton?:S;}

export interface ContourAccordionElement extends ContourElement{exclusive?:boolean;src?:S;}
export interface ContourActivityElement extends ContourElement{src?:S;}
export interface ContourActivityFeedElement extends ContourElement{filter?:S;"unread-only"?:boolean;}
export interface ContourAnimationControlsElement extends ContourElement{playing?:boolean;speed?:S;progress?:S;loop?:boolean;step?:S;markers?:S;}
export interface ContourAnnotationElement extends ContourElement{x?:S;y?:S;}
export interface ContourAvatarElement extends ContourElement{src?:S;}
export interface ContourAxisElement extends ContourDataElement{orientation?:S;values?:S;ticks?:S;format?:S;locale?:S;padding?:S;min?:S;max?:S;}
export interface ContourBivariateElement extends ContourDataElement{size?:S;axisX?:S;axisY?:S;colors?:S;selected?:S;}
export interface ContourBreadcrumbElement extends ContourElement{src?:S;}
export interface ContourBrownoutElement extends ContourElement{level?:S;}
export interface ContourBrushElement extends ContourDataElement{start?:S;end?:S;min?:S;max?:S;}
export interface ContourBtnElement extends ContourElement{disabled?:boolean;}
export interface ContourCalendarElement extends ContourElement{month?:S;year?:S;}
export interface ContourCatchmentElement extends ContourDataElement{label?:S;area?:S;center?:S;}
export interface ContourCategoryElement extends ContourDataElement{items?:S;search?:S;note?:S;limit?:S;sort?:S;}
export interface ContourChangelogElement extends ContourElement{src?:S;}
export interface ContourChartElement extends ContourDataElement{axis?:S;color?:S;zoomable?:boolean;brush?:boolean;note?:S;"bucket-count"?:S;"limit-values"?:S;}
export interface ContourChartGridElement extends ContourElement{src?:S;}
export interface ContourCheckElement extends ContourFormElement{label?:S;type?:S;error?:S;help?:S;}
export interface ContourCodeElement extends ContourElement{numbered?:boolean;}
export interface ContourCodeTabsElement extends ContourElement{src?:S;}
export interface ContourColorPickerElement extends ContourFormElement{label?:S;error?:S;help?:S;alpha?:boolean;presets?:S;}
export interface ContourComboboxElement extends ContourFormElement{options?:S;label?:S;multiple?:boolean;virtual?:boolean;src?:S;}
export interface ContourCommandPaletteElement extends ContourElement{open?:boolean;}
export interface ContourCompareElement extends ContourElement{src?:S;}
export interface ContourCompassFullElement extends ContourElement{src?:S;}
export interface ContourContextMenuElement extends ContourElement{trigger?:S;}
export interface ContourContourPlotElement extends ContourElement{values?:S;levels?:S;}
export interface ContourCoordinateElement extends ContourElement{format?:S;locale?:S;precision?:S;src?:S;}
export interface ContourDashFreshnessElement extends ContourDataElement{label?:S;value?:S;format?:S;locale?:S;}
export interface ContourDashKpiRowElement extends ContourDataElement{items?:S;}
export interface ContourDataExportElement extends ContourElement{data?:S;format?:S;filename?:S;}
export interface ContourDataGridElement extends ContourDataElement{columns?:S;rows?:S;page?:S;filter?:S;"page-size"?:S;resizable?:boolean;virtual?:boolean;"row-height"?:S;}
export interface ContourDatePickerElement extends ContourFormElement{range?:boolean;rangeStart?:S;rangeEnd?:S;label?:S;error?:S;help?:S;time?:boolean;locale?:S;}
export interface ContourDateRangeElement extends ContourFormElement{start?:S;end?:S;label?:S;time?:boolean;locale?:S;}
export interface ContourDeltaElement extends ContourDataElement{value?:S;direction?:S;}
export interface ContourDividerElement extends ContourElement{orientation?:S;}
export interface ContourDocsNavElement extends ContourElement{src?:S;}
export interface ContourDonutElement extends ContourDataElement{value?:S;values?:S;items?:S;label?:S;color?:S;note?:S;}
export interface ContourDropIndicatorElement extends ContourElement{open?:boolean;}
export interface ContourEmptyElement extends ContourElement{illustration?:S;}
export interface ContourErrorBoundaryElement extends ContourElement{fallback?:S;}
export interface ContourFaqElement extends ContourElement{src?:S;}
export interface ContourFeatureInspectorElement extends ContourElement{open?:boolean;}
export interface ContourFieldElement extends ContourElement{disabled?:boolean;}
export interface ContourFileUploadElement extends ContourFormElement{label?:S;accept?:S;multiple?:boolean;progress?:S;}
export interface ContourFilterBarElement extends ContourElement{src?:S;clearable?:S;scope?:S;}
export interface ContourFlowMapElement extends ContourDataElement{label?:S;nodes?:S;}
export interface ContourFormElement extends ContourElement{submitting?:boolean;submitLabel?:S;}
export interface ContourGaugeElement extends ContourDataElement{value?:S;min?:S;max?:S;heading?:S;thresholds?:S;format?:S;locale?:S;unit?:S;brownout?:S;}
export interface ContourGeocoderElement extends ContourElement{results?:S;src?:S;}
export interface ContourHeatmapElement extends ContourDataElement{cells?:S;count?:S;legend?:S;}
export interface ContourHexbinElement extends ContourDataElement{label?:S;cells?:S;}
export interface ContourHoverCardElement extends ContourElement{content?:S;}
export interface ContourInputFullElement extends ContourElement{disabled?:boolean;help?:S;}
export interface ContourInputGroupElement extends ContourElement{clearable?:boolean;submit?:boolean;}
export interface ContourInstrumentElement extends ContourDataElement{rows?:S;}
export interface ContourIsochroneElement extends ContourDataElement{label?:S;center?:S;rings?:S;}
export interface ContourKpiElement extends ContourDataElement{value?:S;label?:S;delta?:S;direction?:S;note?:S;variant?:S;unit?:S;format?:S;locale?:S;thresholds?:S;threshold?:S;sparkline?:S;polarity?:S;}
export interface ContourLandingFeaturesFullElement extends ContourElement{src?:S;}
export interface ContourLayerPanelElement extends ContourElement{src?:S;}
export interface ContourLayerSwitchElement extends ContourElement{src?:S;}
export interface ContourLegendElement extends ContourDataElement{title?:S;ramp?:S;scale?:S;items?:S;method?:S;norm?:S;selectable?:boolean;graduated?:boolean;}
export interface ContourMapPopupElement extends ContourElement{content?:S;"cluster-count"?:number;"cluster-expanded"?:boolean;"cluster-items"?:S;}
export interface ContourMeasureElement extends ContourDataElement{label?:S;value?:S;point?:S;line?:S;}
export interface ContourMenuElement extends ContourElement{src?:S;}
export interface ContourMeterElement extends ContourElement{low?:S;high?:S;optimum?:S;src?:S;}
export interface ContourMetricsFullElement extends ContourElement{src?:S;}
export interface ContourMinimapElement extends ContourElement{src?:S;}
export interface ContourNumberFieldElement extends ContourFormElement{label?:S;error?:S;help?:S;}
export interface ContourPaginationElement extends ContourElement{src?:S;}
export interface ContourPaletteEditorElement extends ContourElement{colors?:S;}
export interface ContourPanelElement extends ContourElement{collapsible?:boolean;collapsed?:boolean;}
export interface ContourPivotElement extends ContourDataElement{rows?:S;columns?:S;values?:S;filter?:S;aggregate?:S;}
export interface ContourPopoverElement extends ContourElement{content?:S;}
export interface ContourPressableFullElement extends ContourElement{disabled?:boolean;}
export interface ContourPriceFullElement extends ContourElement{format?:S;locale?:S;}
export interface ContourProgressElement extends ContourElement{paused?:boolean;pausable?:boolean;}
export interface ContourProvenanceElement extends ContourElement{source?:S;confidence?:S;resolution?:S;coverage?:S;warning?:S;methodology?:S;}
export interface ContourPullToRefreshElement extends ContourElement{threshold?:S;}
export interface ContourRadioElement extends ContourFormElement{label?:S;error?:S;help?:S;}
export interface ContourRadioListElement extends ContourElement{src?:S;}
export interface ContourRangeElement extends ContourFormElement{label?:S;error?:S;help?:S;}
export interface ContourRatingElement extends ContourFormElement{color?:S;}
export interface ContourReadoutElement extends ContourDataElement{rows?:S;format?:S;locale?:S;}
export interface ContourResizeObserverElement extends ContourElement{debounce?:S;}
export interface ContourResponsiveContentElement extends ContourElement{breakpoint?:S;}
export interface ContourRowActionFullElement extends ContourElement{disabled?:boolean;}
export interface ContourSavedViewElement extends ContourElement{updated?:S;source?:S;active?:boolean;}
export interface ContourScaleBarElement extends ContourElement{distance?:S;resolution?:S;latitude?:S;src?:S;}
export interface ContourSegmentedElement extends ContourFormElement{options?:S;selected?:S;label?:S;}
export interface ContourSelectElement extends ContourFormElement{options?:S;label?:S;error?:S;help?:S;multiple?:boolean;autocomplete?:S;}
export interface ContourShowcaseFullElement extends ContourElement{src?:S;}
export interface ContourSideSheetElement extends ContourElement{open?:boolean;side?:S;}
export interface ContourSidebarElement extends ContourElement{collapsed?:boolean;}
export interface ContourSkeletonElement extends ContourElement{shimmer?:boolean;}
export interface ContourSparklineElement extends ContourDataElement{points?:S;}
export interface ContourSpatialFilterElement extends ContourElement{modes?:S;mode?:S;active?:S;bounds?:S;operator?:S;src?:S;}
export interface ContourSplitButtonElement extends ContourElement{menu?:S;}
export interface ContourSplitMapElement extends ContourElement{left?:S;right?:S;}
export interface ContourSplitViewElement extends ContourElement{"left-label"?:S;"right-label"?:S;}
export interface ContourStackedBarElement extends ContourDataElement{segments?:S;values?:S;colors?:S;normalize?:S;}
export interface ContourStatElement extends ContourDataElement{value?:S;label?:S;delta?:S;unit?:S;format?:S;locale?:S;}
export interface ContourStepsElement extends ContourElement{src?:S;}
export interface ContourStreamingChartElement extends ContourDataElement{line?:S;dot?:S;interval?:number;pause?:boolean;}
export interface ContourStylePanelElement extends ContourElement{layers?:S;classification?:S;palette?:S;breaks?:S;opacity?:S;}
export interface ContourSurveyElement extends ContourElement{src?:S;}
export interface ContourSwatchElement extends ContourElement{selected?:boolean;}
export interface ContourSwitchElement extends ContourFormElement{label?:S;error?:S;help?:S;}
export interface ContourTableElement extends ContourDataElement{columns?:S;rows?:S;page?:number;pageSize?:number;}
export interface ContourTabsElement extends ContourElement{autoplay?:number;pause?:boolean;src?:S;orientation?:S;}
export interface ContourTagsInputElement extends ContourFormElement{error?:S;help?:S;}
export interface ContourTestimonialFullElement extends ContourElement{role?:S;}
export interface ContourTextareaElement extends ContourFormElement{error?:S;help?:S;}
export interface ContourThresholdElement extends ContourDataElement{label?:S;norm?:S;state?:S;value?:S;}
export interface ContourTimePickerElement extends ContourFormElement{label?:S;error?:S;help?:S;}
export interface ContourTimeSeriesElement extends ContourDataElement{values?:S;points?:S;style?:S;annotations?:S;note?:S;}
export interface ContourTimeSliderElement extends ContourElement{distance?:S;resolution?:S;latitude?:S;src?:S;loop?:boolean;speed?:S;speeds?:S;showLoop?:boolean;loopLabel?:S;currentTime?:S;timeFormat?:S;isPlaying?:boolean;playLabel?:S;pauseLabel?:S;timeLabel?:S;speedLabel?:S;}
export interface ContourTimelineElement extends ContourDataElement{items?:S;}
export interface ContourToastElement extends ContourElement{duration?:number;}
export interface ContourTocFullElement extends ContourElement{src?:S;}
export interface ContourToolbarElement extends ContourElement{overflow?:number;}
export interface ContourTooltipElement extends ContourElement{delay?:number;trigger?:S;}
export interface ContourTreeElement extends ContourElement{src?:S;"item-height"?:S;}
export interface ContourTreeGridElement extends ContourElement{expanded?:S;}
export interface ContourVersionElement extends ContourFormElement{options?:S;}
export interface ContourVersionBannerFullElement extends ContourElement{link?:S;dismissible?:boolean;}
export interface ContourVirtualListElement extends ContourElement{"item-height"?:S;orientation?:S;sticky?:boolean;}
export interface ContourWidgetStateElement extends ContourElement{loading?:S;retry?:S;src?:S;}
declare global { interface HTMLElementTagNameMap {
  "contour-accordion":ContourAccordionElement;
  "contour-activity":ContourActivityElement;
  "contour-activity-feed":ContourActivityFeedElement;
  "contour-advanced":ContourElement;
  "contour-affordance":ContourElement;
  "contour-affordances":ContourElement;
  "contour-alert":ContourElement;
  "contour-anchor":ContourElement;
  "contour-animation-controls":ContourAnimationControlsElement;
  "contour-annotation":ContourAnnotationElement;
  "contour-app":ContourElement;
  "contour-app-body":ContourElement;
  "contour-avatar":ContourAvatarElement;
  "contour-avatar-group":ContourElement;
  "contour-axis":ContourAxisElement;
  "contour-badge":ContourElement;
  "contour-badge-overflow":ContourElement;
  "contour-banner":ContourElement;
  "contour-bivariate":ContourBivariateElement;
  "contour-bivariate-legend":ContourElement;
  "contour-box":ContourElement;
  "contour-brand":ContourElement;
  "contour-breadcrumb":ContourBreadcrumbElement;
  "contour-brownout":ContourBrownoutElement;
  "contour-brush":ContourBrushElement;
  "contour-btn":ContourBtnElement;
  "contour-btn-group":ContourElement;
  "contour-calendar":ContourCalendarElement;
  "contour-callout":ContourElement;
  "contour-card":ContourElement;
  "contour-carousel":ContourElement;
  "contour-catchment":ContourCatchmentElement;
  "contour-category":ContourCategoryElement;
  "contour-changelog":ContourChangelogElement;
  "contour-chart":ContourChartElement;
  "contour-chart-grid":ContourChartGridElement;
  "contour-check":ContourCheckElement;
  "contour-chip":ContourElement;
  "contour-cluster":ContourElement;
  "contour-code":ContourCodeElement;
  "contour-code-tabs":ContourCodeTabsElement;
  "contour-color-picker":ContourColorPickerElement;
  "contour-combobox":ContourComboboxElement;
  "contour-command":ContourElement;
  "contour-command-palette":ContourCommandPaletteElement;
  "contour-compare":ContourCompareElement;
  "contour-comparison":ContourElement;
  "contour-compass":ContourElement;
  "contour-container":ContourElement;
  "contour-context-menu":ContourContextMenuElement;
  "contour-contour-plot":ContourContourPlotElement;
  "contour-coordinate":ContourCoordinateElement;
  "contour-cta":ContourElement;
  "contour-dash-freshness":ContourDashFreshnessElement;
  "contour-dash-kpi-row":ContourDashKpiRowElement;
  "contour-dash-shell":ContourElement;
  "contour-dash-toolbar":ContourElement;
  "contour-data-export":ContourDataExportElement;
  "contour-data-grid":ContourDataGridElement;
  "contour-data-table":ContourElement;
  "contour-datamark":ContourElement;
  "contour-date-picker":ContourDatePickerElement;
  "contour-date-range":ContourDateRangeElement;
  "contour-delta":ContourDeltaElement;
  "contour-destructive-hint":ContourElement;
  "contour-dialog":ContourElement;
  "contour-diff":ContourElement;
  "contour-disclosure":ContourElement;
  "contour-divider":ContourDividerElement;
  "contour-do-dont":ContourElement;
  "contour-docs-nav":ContourDocsNavElement;
  "contour-docs-shell":ContourElement;
  "contour-donut":ContourDonutElement;
  "contour-dot":ContourElement;
  "contour-drag-handle":ContourElement;
  "contour-draggable":ContourElement;
  "contour-drawer":ContourElement;
  "contour-drop-indicator":ContourDropIndicatorElement;
  "contour-drop-zone":ContourElement;
  "contour-dropdown":ContourElement;
  "contour-elevation":ContourElement;
  "contour-empty":ContourEmptyElement;
  "contour-error-boundary":ContourErrorBoundaryElement;
  "contour-expandable":ContourElement;
  "contour-fab":ContourElement;
  "contour-faq":ContourFaqElement;
  "contour-feature":ContourElement;
  "contour-feature-inspector":ContourFeatureInspectorElement;
  "contour-field":ContourFieldElement;
  "contour-field-group":ContourElement;
  "contour-file-tree":ContourElement;
  "contour-file-upload":ContourFileUploadElement;
  "contour-filter-bar":ContourFilterBarElement;
  "contour-filter-pill":ContourElement;
  "contour-flag":ContourElement;
  "contour-flow-map":ContourFlowMapElement;
  "contour-footer":ContourElement;
  "contour-form":ContourFormElement;
  "contour-gauge":ContourGaugeElement;
  "contour-geocoder":ContourGeocoderElement;
  "contour-header":ContourElement;
  "contour-heatmap":ContourHeatmapElement;
  "contour-hexbin":ContourHexbinElement;
  "contour-hover-card":ContourHoverCardElement;
  "contour-icon-badge":ContourElement;
  "contour-input":ContourElement;
  "contour-input-group":ContourInputGroupElement;
  "contour-install":ContourElement;
  "contour-instrument":ContourInstrumentElement;
  "contour-isochrone":ContourIsochroneElement;
  "contour-kbd":ContourElement;
  "contour-kpi":ContourKpiElement;
  "contour-landing-features":ContourElement;
  "contour-landing-hero":ContourElement;
  "contour-layer-panel":ContourLayerPanelElement;
  "contour-layer-switch":ContourLayerSwitchElement;
  "contour-legend":ContourLegendElement;
  "contour-link":ContourElement;
  "contour-linkish":ContourElement;
  "contour-live-badge":ContourElement;
  "contour-loading":ContourElement;
  "contour-logos":ContourElement;
  "contour-map-area":ContourElement;
  "contour-map-footer":ContourElement;
  "contour-map-panel":ContourElement;
  "contour-map-popup":ContourMapPopupElement;
  "contour-map-slot":ContourElement;
  "contour-mark":ContourElement;
  "contour-measure":ContourMeasureElement;
  "contour-menu":ContourMenuElement;
  "contour-meter":ContourMeterElement;
  "contour-metrics":ContourElement;
  "contour-minimap":ContourMinimapElement;
  "contour-notification-center":ContourElement;
  "contour-number-field":ContourNumberFieldElement;
  "contour-pager":ContourElement;
  "contour-pagination":ContourPaginationElement;
  "contour-palette-editor":ContourPaletteEditorElement;
  "contour-panel":ContourPanelElement;
  "contour-pill":ContourElement;
  "contour-pivot":ContourPivotElement;
  "contour-plate":ContourElement;
  "contour-popover":ContourPopoverElement;
  "contour-pressable":ContourElement;
  "contour-price":ContourElement;
  "contour-pricing":ContourElement;
  "contour-progress":ContourProgressElement;
  "contour-prose":ContourElement;
  "contour-provenance":ContourProvenanceElement;
  "contour-pull-to-refresh":ContourPullToRefreshElement;
  "contour-pullquote":ContourElement;
  "contour-radio":ContourRadioElement;
  "contour-radio-list":ContourRadioListElement;
  "contour-range":ContourRangeElement;
  "contour-range-scale":ContourElement;
  "contour-rating":ContourRatingElement;
  "contour-readout":ContourReadoutElement;
  "contour-recipe":ContourElement;
  "contour-reserved":ContourElement;
  "contour-resizable":ContourElement;
  "contour-resize-handle":ContourElement;
  "contour-resize-observer":ContourResizeObserverElement;
  "contour-responsive-content":ContourResponsiveContentElement;
  "contour-row":ContourElement;
  "contour-row-action":ContourElement;
  "contour-saved-view":ContourSavedViewElement;
  "contour-scale-bar":ContourScaleBarElement;
  "contour-scheme-toggle":ContourElement;
  "contour-scrim":ContourElement;
  "contour-scroll-area":ContourElement;
  "contour-search-trigger":ContourElement;
  "contour-section-head":ContourElement;
  "contour-segmented":ContourSegmentedElement;
  "contour-select":ContourSelectElement;
  "contour-sheet":ContourElement;
  "contour-shortcut":ContourElement;
  "contour-shortcut-list":ContourElement;
  "contour-shortcut-overlay":ContourElement;
  "contour-shortcut-panel":ContourElement;
  "contour-shortcut-row":ContourElement;
  "contour-showcase":ContourElement;
  "contour-side-sheet":ContourSideSheetElement;
  "contour-sidebar":ContourSidebarElement;
  "contour-skeleton":ContourSkeletonElement;
  "contour-skeleton-group":ContourElement;
  "contour-sortable-list":ContourElement;
  "contour-sparkline":ContourSparklineElement;
  "contour-spatial-filter":ContourSpatialFilterElement;
  "contour-spinner":ContourElement;
  "contour-split-button":ContourSplitButtonElement;
  "contour-split-map":ContourSplitMapElement;
  "contour-split-view":ContourSplitViewElement;
  "contour-stack":ContourElement;
  "contour-stacked-bar":ContourStackedBarElement;
  "contour-stat":ContourStatElement;
  "contour-status-light":ContourElement;
  "contour-stepper":ContourElement;
  "contour-steps":ContourStepsElement;
  "contour-streaming-chart":ContourStreamingChartElement;
  "contour-style-panel":ContourStylePanelElement;
  "contour-style-switcher":ContourElement;
  "contour-survey":ContourSurveyElement;
  "contour-swatch":ContourSwatchElement;
  "contour-switch":ContourSwitchElement;
  "contour-table":ContourTableElement;
  "contour-table-wrap":ContourElement;
  "contour-tabs":ContourTabsElement;
  "contour-tag":ContourElement;
  "contour-tags-input":ContourTagsInputElement;
  "contour-testimonial":ContourElement;
  "contour-textarea":ContourTextareaElement;
  "contour-theme-scope":ContourElement;
  "contour-threshold":ContourThresholdElement;
  "contour-time-picker":ContourTimePickerElement;
  "contour-time-range":ContourElement;
  "contour-time-series":ContourTimeSeriesElement;
  "contour-time-slider":ContourTimeSliderElement;
  "contour-timeline":ContourTimelineElement;
  "contour-toast":ContourToastElement;
  "contour-toast-host":ContourElement;
  "contour-toc":ContourElement;
  "contour-toolbar":ContourToolbarElement;
  "contour-tooltip":ContourTooltipElement;
  "contour-tour":ContourElement;
  "contour-tree":ContourTreeElement;
  "contour-tree-grid":ContourTreeGridElement;
  "contour-version":ContourVersionElement;
  "contour-version-banner":ContourElement;
  "contour-virtual-list":ContourVirtualListElement;
  "contour-widget-state":ContourWidgetStateElement;
  "contour-shadow-accordion":ContourElement;
  "contour-shadow-activity":ContourElement;
  "contour-shadow-advanced":ContourElement;
  "contour-shadow-affordance":ContourElement;
  "contour-shadow-affordances":ContourElement;
  "contour-shadow-alert":ContourElement;
  "contour-shadow-anchor":ContourElement;
  "contour-shadow-app":ContourElement;
  "contour-shadow-app-body":ContourElement;
  "contour-shadow-avatar":ContourElement;
  "contour-shadow-axis":ContourElement;
  "contour-shadow-badge":ContourElement;
  "contour-shadow-bivariate":ContourElement;
  "contour-shadow-bivariate-legend":ContourElement;
  "contour-shadow-box":ContourElement;
  "contour-shadow-brand":ContourElement;
  "contour-shadow-breadcrumb":ContourElement;
  "contour-shadow-brownout":ContourElement;
  "contour-shadow-brush":ContourElement;
  "contour-shadow-btn":ContourElement;
  "contour-shadow-btn-group":ContourElement;
  "contour-shadow-callout":ContourElement;
  "contour-shadow-card":ContourElement;
  "contour-shadow-catchment":ContourElement;
  "contour-shadow-category":ContourElement;
  "contour-shadow-chart":ContourElement;
  "contour-shadow-chart-grid":ContourElement;
  "contour-shadow-check":ContourElement;
  "contour-shadow-chip":ContourElement;
  "contour-shadow-cluster":ContourElement;
  "contour-shadow-code":ContourElement;
  "contour-shadow-code-tabs":ContourElement;
  "contour-shadow-combobox":ContourElement;
  "contour-shadow-command":ContourElement;
  "contour-shadow-compare":ContourElement;
  "contour-shadow-comparison":ContourElement;
  "contour-shadow-compass":ContourElement;
  "contour-shadow-container":ContourElement;
  "contour-shadow-contour-plot":ContourElement;
  "contour-shadow-coordinate":ContourElement;
  "contour-shadow-cta":ContourElement;
  "contour-shadow-dash-freshness":ContourElement;
  "contour-shadow-dash-kpi-row":ContourElement;
  "contour-shadow-dash-shell":ContourElement;
  "contour-shadow-dash-toolbar":ContourElement;
  "contour-shadow-datamark":ContourElement;
  "contour-shadow-delta":ContourElement;
  "contour-shadow-destructive-hint":ContourElement;
  "contour-shadow-dialog":ContourElement;
  "contour-shadow-diff":ContourElement;
  "contour-shadow-disclosure":ContourElement;
  "contour-shadow-do-dont":ContourElement;
  "contour-shadow-docs-nav":ContourElement;
  "contour-shadow-docs-shell":ContourElement;
  "contour-shadow-donut":ContourElement;
  "contour-shadow-dot":ContourElement;
  "contour-shadow-drag-handle":ContourElement;
  "contour-shadow-draggable":ContourElement;
  "contour-shadow-drawer":ContourElement;
  "contour-shadow-drop-indicator":ContourElement;
  "contour-shadow-drop-zone":ContourElement;
  "contour-shadow-elevation":ContourElement;
  "contour-shadow-empty":ContourElement;
  "contour-shadow-expandable":ContourElement;
  "contour-shadow-faq":ContourElement;
  "contour-shadow-feature":ContourElement;
  "contour-shadow-field":ContourElement;
  "contour-shadow-filter-bar":ContourElement;
  "contour-shadow-filter-pill":ContourElement;
  "contour-shadow-flag":ContourElement;
  "contour-shadow-flow-map":ContourElement;
  "contour-shadow-footer":ContourElement;
  "contour-shadow-gauge":ContourElement;
  "contour-shadow-header":ContourElement;
  "contour-shadow-heatmap":ContourElement;
  "contour-shadow-hexbin":ContourElement;
  "contour-shadow-icon-badge":ContourElement;
  "contour-shadow-input":ContourElement;
  "contour-shadow-input-group":ContourElement;
  "contour-shadow-install":ContourElement;
  "contour-shadow-instrument":ContourElement;
  "contour-shadow-isochrone":ContourElement;
  "contour-shadow-kbd":ContourElement;
  "contour-shadow-kpi":ContourElement;
  "contour-shadow-landing-features":ContourElement;
  "contour-shadow-landing-hero":ContourElement;
  "contour-shadow-layer-panel":ContourElement;
  "contour-shadow-layer-switch":ContourElement;
  "contour-shadow-legend":ContourElement;
  "contour-shadow-link":ContourElement;
  "contour-shadow-linkish":ContourElement;
  "contour-shadow-live-badge":ContourElement;
  "contour-shadow-loading":ContourElement;
  "contour-shadow-logos":ContourElement;
  "contour-shadow-map-area":ContourElement;
  "contour-shadow-map-footer":ContourElement;
  "contour-shadow-map-panel":ContourElement;
  "contour-shadow-map-slot":ContourElement;
  "contour-shadow-mark":ContourElement;
  "contour-shadow-measure":ContourElement;
  "contour-shadow-menu":ContourElement;
  "contour-shadow-meter":ContourElement;
  "contour-shadow-metrics":ContourElement;
  "contour-shadow-minimap":ContourElement;
  "contour-shadow-pager":ContourElement;
  "contour-shadow-pagination":ContourElement;
  "contour-shadow-panel":ContourElement;
  "contour-shadow-pill":ContourElement;
  "contour-shadow-plate":ContourElement;
  "contour-shadow-pressable":ContourElement;
  "contour-shadow-price":ContourElement;
  "contour-shadow-pricing":ContourElement;
  "contour-shadow-progress":ContourElement;
  "contour-shadow-prose":ContourElement;
  "contour-shadow-pullquote":ContourElement;
  "contour-shadow-radio":ContourElement;
  "contour-shadow-radio-list":ContourElement;
  "contour-shadow-range":ContourElement;
  "contour-shadow-range-scale":ContourElement;
  "contour-shadow-readout":ContourElement;
  "contour-shadow-recipe":ContourElement;
  "contour-shadow-reserved":ContourElement;
  "contour-shadow-resizable":ContourElement;
  "contour-shadow-resize-handle":ContourElement;
  "contour-shadow-row":ContourElement;
  "contour-shadow-row-action":ContourElement;
  "contour-shadow-scale-bar":ContourElement;
  "contour-shadow-scheme-toggle":ContourElement;
  "contour-shadow-scrim":ContourElement;
  "contour-shadow-scroll-area":ContourElement;
  "contour-shadow-search-trigger":ContourElement;
  "contour-shadow-section-head":ContourElement;
  "contour-shadow-segmented":ContourElement;
  "contour-shadow-select":ContourElement;
  "contour-shadow-sheet":ContourElement;
  "contour-shadow-shortcut-list":ContourElement;
  "contour-shadow-shortcut-overlay":ContourElement;
  "contour-shadow-shortcut-panel":ContourElement;
  "contour-shadow-shortcut-row":ContourElement;
  "contour-shadow-showcase":ContourElement;
  "contour-shadow-sidebar":ContourElement;
  "contour-shadow-skeleton":ContourElement;
  "contour-shadow-sparkline":ContourElement;
  "contour-shadow-spinner":ContourElement;
  "contour-shadow-stack":ContourElement;
  "contour-shadow-stacked-bar":ContourElement;
  "contour-shadow-stat":ContourElement;
  "contour-shadow-steps":ContourElement;
  "contour-shadow-streaming-chart":ContourElement;
  "contour-shadow-survey":ContourElement;
  "contour-shadow-switch":ContourElement;
  "contour-shadow-table":ContourElement;
  "contour-shadow-table-wrap":ContourElement;
  "contour-shadow-tabs":ContourElement;
  "contour-shadow-tag":ContourElement;
  "contour-shadow-testimonial":ContourElement;
  "contour-shadow-textarea":ContourElement;
  "contour-shadow-theme-scope":ContourElement;
  "contour-shadow-threshold":ContourElement;
  "contour-shadow-time-range":ContourElement;
  "contour-shadow-time-slider":ContourElement;
  "contour-shadow-timeline":ContourElement;
  "contour-shadow-toast":ContourElement;
  "contour-shadow-toast-host":ContourElement;
  "contour-shadow-toc":ContourElement;
  "contour-shadow-toolbar":ContourElement;
  "contour-shadow-tooltip":ContourElement;
  "contour-shadow-tree":ContourElement;
  "contour-shadow-version":ContourElement;
  "contour-shadow-version-banner":ContourElement;
  "contour-shadow-widget-state":ContourElement;
  }
interface Window { Contour: ContourAPI; } }