# ComposeWeb Studio

ComposeWeb Studio is an online, client-side Kotlin Compose interpreter that allows developers to write Jetpack Compose-like code and instantly preview a working website in the browser. 

The workspace is styled to match the look and feel of Android Studio (IntelliJ Darcula dark theme), complete with dynamic auto-completion, hover tips, minimized-by-default bottom Logcat tool drawer, and a floating device preview zoom panel.

---

## Key Syntax & Language Support

### 1. Variables & State Actions
* **State Declarations**: Support for `remember { mutableStateOf(initialValue) }` to track state.
  ```kotlin
  val count = remember { mutableStateOf(0) }
  ```
* **Property Delegation (`by` delegate)**: Standard property delegates to read/write states directly without calling `.value`.
  ```kotlin
  var text by remember { mutableStateOf("") }
  ```

### 2. Control Flow & Loops
* **Conditionals**: Support for if/else blocks to display views conditionally.
  ```kotlin
  if (showCard.value) {
      Text("Card is open")
  }
  ```
* **For Loops & Ranges (`..`)**: Iterates through collections and ranges recursively.
  ```kotlin
  for (i in 1..5) {
      Text(text = "Item number: ${i}")
  }
  ```

### 3. Metric Units
* Support for scales: `dp` (layout density) and `sp` (scalable pixels, e.g. for text font scaling) interchangeably.
  ```kotlin
  Text(text = "Header", fontSize = 24.sp, modifier = Modifier.padding(16.dp))
  ```

---

## Supported Composable Components

### 1. Core Layouts & Display
* `Column`: Places children sequentially in a vertical alignment.
* `Row`: Places children horizontally.
* `Box`: Stack container for overlapping elements.
* `Spacer`: Inserts spaces in row/column.
* `Text`: Displays text labels.
* `Image`: Displays loaded image from URL.
* `HorizontalDivider` / `VerticalDivider` / `Divider`: Structural lines.
* `LazyColumn` / `LazyRow`: Scrollable collections.

### 2. Material 3 Buttons
* `Button` (Filled)
* `ElevatedButton`
* `FilledTonalButton`
* `OutlinedButton`
* `TextButton`
* `IconButton`
* `FilledIconButton`
* `OutlinedIconButton`
* `FloatingActionButton`
* `ExtendedFloatingActionButton`

### 3. Cards & Surfaces
* `Card`
* `ElevatedCard`
* `OutlinedCard`
* `Surface`

### 4. Interactive Inputs & Widgets
* `TextField`
* `OutlinedTextField`
* `SecureTextField`
* `Checkbox`
* `RadioButton`
* `Switch`
* `Slider`
* `RangeSlider`
* `DatePicker` (renders an interactive calendar grid)
* `TimePicker` (renders an interactive digital clock)

### 5. Sheets, Dialogues & Menus
* `Scaffold` (supports slots: `topBar`, `bottomBar`, `floatingActionButton`)
* `NavigationBar` / `NavigationRail` / `NavigationDrawer` / `NavigationSuite`
* `TopAppBar` / `CenterAlignedTopAppBar` / `LargeTopAppBar` / `MediumTopAppBar` / `BottomAppBar`
* `AlertDialog` / `BasicAlertDialog`
* `ModalBottomSheet` / `BottomSheetScaffold`
* `Tooltip`
* `DropdownMenu` / `ExposedDropdownMenuBox`
* `Snackbar` / `SnackbarHost`
* `TabRow` / `ScrollableTabRow`
* `Pager`
* `Chip` / `AssistChip` / `FilterChip` / `InputChip` / `SuggestionChip`
* `Badge` / `BadgeBox`
* `ListItem`

---

## Supported Modifiers

All standard modifiers can be chained on any Composable:
* **Padding & Margins**: `padding(dp)`, `paddingFromBaseline(dp)`, `absolutePadding(dp)`.
* **Sizing & Bounds**: `size(dp)`, `width(dp)`, `height(dp)`, `fillMaxWidth(float)`, `fillMaxHeight(float)`, `fillMaxSize(float)`, `requiredSize(dp)`, `requiredWidth(dp)`, `requiredHeight(dp)`, `defaultMinSize(dp)`, `wrapContentWidth()`, `wrapContentHeight()`, `wrapContentSize()`.
* **Backgrounds & Borders**: `background(Color)`, `border(thickness, Color)`.
* **Transforms & Layers**: `graphicsLayer()`, `alpha(float)`, `rotate(degrees)`, `scale(multiplier)`.
* **Interactions**: `clickable { lambda }`, `combinedClickable()`, `toggleable()`, `selectable()`, `focusable()`, `focusRequester()`.
* **Scrolling**: `verticalScroll()`, `horizontalScroll()`.
* **Layout Weights**: `weight(float)`.
* **Alignments**: `align(Alignment)`, `alignBy()`.
* **Aspect Ratios**: `aspectRatio(float)`.
* **Animations**: `animateContentSize()`.
* **Safe Areas & Insets**: `imePadding()`, `systemBarsPadding()`, `navigationBarsPadding()`, `safeDrawingPadding()`, `windowInsetsPadding()`, `consumeWindowInsets()`.
* **No-ops**: `testTag()`, `semantics()`, `clearAndSetSemantics()`, `layoutId()`, `onGloballyPositioned()`.

---

## Supported Enums & Runtime Stubs

### Enums
* `Alignment`: `Top`, `Center`, `Bottom`, `Start`, `CenterHorizontally`, `End`, `TopStart`, `TopEnd`, `BottomStart`, `BottomEnd`.
* `Arrangement`: `Top`, `Center`, `Bottom`, `Start`, `End`, `SpaceBetween`, `SpaceAround`, `SpaceEvenly`.
* `FontWeight`: `Normal`, `Medium`, `SemiBold`, `Bold`, `ExtraBold`.
* `FontStyle`: `Normal`, `Italic`.
* `TextAlign`: `Left`, `Center`, `Right`, `Justify`.
* `TextDecoration`: `None`, `Underline`, `LineThrough`.
* `TextOverflow`: `Clip`, `Ellipsis`, `Visible`.
* `ContentScale`: `Crop`, `Fit`, `FillBounds`, `Inside`, `None`.
* `ContentAlpha`: `High`, `Medium`, `Disabled`.
* `KeyboardType`: `Text`, `Number`, `Phone`, `Email`, `Password`.
* `ImeAction`: `Default`, `Go`, `Search`, `Send`, `Next`, `Done`.
* `KeyboardCapitalization`: `None`, `Characters`, `Words`, `Sentences`.
* `StrokeCap`: `Butt`, `Round`, `Square`.
* `StrokeJoin`: `Miter`, `Round`, `Bevel`.
* `BlendMode`: `SrcOver`, `DstOver`.
* `Color`: `Red`, `Blue`, `Green`, `Yellow`, `White`, `Black`, `Gray`, `LightGray`, `DarkGray`, `Transparent`, `Primary`, `Secondary`.

### Side-Effect / Runtime Stubs
* `derivedStateOf { lambda }`
* `rememberSaveable { lambda }`
* `rememberCoroutineScope()`
* `LaunchedEffect(key) { lambda }`
* `DisposableEffect(key) { lambda }`
* `SideEffect { lambda }`
* `produceState(initialValue)`

---

## ⚡ Live Demo

Try ComposeWeb Studio live at: [https://composestudio.netlify.app/](https://composestudio.netlify.app/)
