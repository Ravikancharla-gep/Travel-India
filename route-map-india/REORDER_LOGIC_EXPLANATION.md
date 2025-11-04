# Drag & Drop Reordering Logic Explanation

This document explains how the drag-and-drop reordering works for both **Trip Lists** and **Places** in the application.

## Overview

The reordering system uses HTML5 Drag & Drop API with React state management. The logic consists of two main parts:
1. **Visual Feedback** (Sidebar.tsx) - Shows drop indicators and handles drag events
2. **Reordering Logic** (App.tsx) - Calculates the final position and updates the array

---

## 1. Trip Lists Reordering

### Location
- **UI Handlers**: `route-map-india/src/components/Sidebar.tsx` (lines ~370-500)
- **Reordering Function**: `route-map-india/src/App.tsx` (lines 654-717)

### How It Works

#### Step 1: Drag Start
When you start dragging a trip list item:
```typescript
onDragStart={(e) => {
  e.dataTransfer.setData('text/trip-id', trip.id);  // Store the ID being dragged
  setDraggedTripId(trip.id);  // Track which item is being dragged
}}
```

#### Step 2: Drag Over (Visual Feedback)
As you drag over other items, the system calculates where to show the purple drop indicator:

```typescript
onDragEnter/onDragOver={(e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const midpoint = rect.top + rect.height / 2;
  const deadzone = 5;  // 5px buffer to prevent flickering
  
  // Determine target index based on cursor position
  if (e.clientY < midpoint - deadzone) {
    targetIndex = tripIndex;  // Show line above this item
  } else if (e.clientY > midpoint + deadzone) {
    targetIndex = tripIndex + 1;  // Show line below this item
  }
  
  setDragOverIndex(targetIndex);  // This controls where the purple line appears
}}
```

**Key Concept**: The purple line appears **above** the item at `dragOverIndex`. So if `dragOverIndex = 2`, the line appears above item at index 2.

#### Step 3: Drop (Reordering)
When you drop the item:

```typescript
onDrop={(e) => {
  const sourceId = e.dataTransfer.getData('text/trip-id');
  onReorderTrip(sourceId, dragOverIndex);  // Pass the target index
}}
```

#### Step 4: Calculate Final Position (`reorderTrip` function)
This is the **core logic** that handles edge cases:

```typescript
const reorderTrip = (tripId: string, targetIndex: number) => {
  const currentIndex = tripLists.findIndex(t => t.id === tripId);
  
  // Clamp targetIndex to valid range
  const clampedTargetIndex = Math.max(0, Math.min(targetIndex, tripLists.length));
  
  let finalIndex: number;
  
  if (currentIndex === clampedTargetIndex) {
    return;  // Already in correct position
  } 
  else if (currentIndex < clampedTargetIndex) {
    // Moving DOWN (forward): [A, B, C, D] - dragging A (idx 0) to targetIndex 2
    // After removing A: [B, C, D] - indices shift
    // We want to insert at position 2, but after removal it becomes position 1
    if (currentIndex === 0 && clampedTargetIndex === 1) {
      finalIndex = 1;  // Special case
    } else {
      finalIndex = clampedTargetIndex - 1;  // Account for removed item
    }
  } 
  else {
    // Moving UP (backward): [A, B, C, D] - dragging D (idx 3) to targetIndex 1
    // After removing D: [A, B, C] - indices don't shift for items before
    // We want to insert at position 1, which is still position 1
    finalIndex = clampedTargetIndex;  // No adjustment needed
  }
  
  // Perform the actual reordering
  const newTripLists = [...appState.tripLists];
  const [moved] = newTripLists.splice(currentIndex, 1);  // Remove from current position
  newTripLists.splice(finalIndex, 0, moved);  // Insert at final position
}
```

**Example Scenarios**:
- Drag List-1 (idx 0) to Line-4 (targetIndex 3): 
  - `currentIndex = 0`, `targetIndex = 3`
  - Moving DOWN → `finalIndex = 3 - 1 = 2`
  - Result: List-1 goes to position 2 (3rd item)

- Drag List-4 (idx 3) to Line-2 (targetIndex 1):
  - `currentIndex = 3`, `targetIndex = 1`
  - Moving UP → `finalIndex = 1`
  - Result: List-4 goes to position 1 (2nd item)

---

## 2. Places Reordering

### Location
- **UI Handlers**: `route-map-india/src/components/Sidebar.tsx` (lines ~850-1000)
- **Reordering Function**: `route-map-india/src/App.tsx` (lines 488-547)

### How It Works

The logic is **very similar** to Trip Lists, but with some differences:

#### Key Differences:
1. **No Deadzone**: Places use immediate response (no 5px buffer)
2. **Numbering**: After reordering, places are renumbered sequentially
3. **Container Handling**: Special logic for dropping at the end of the list

#### Step 1-3: Same as Trip Lists
- Drag start stores `place.id`
- Drag over calculates `dragOverPlaceIndex`
- Drop passes `targetIndex` to `reorderPlace`

#### Step 4: Calculate Final Position (`reorderPlace` function)

```typescript
const reorderPlace = (placeId: string, targetIndex: number) => {
  const currentIndex = trip.places.findIndex(p => p.id === placeId);
  const clampedTargetIndex = Math.max(0, Math.min(targetIndex, trip.places.length));
  
  let finalIndex: number;
  
  if (currentIndex === clampedTargetIndex) {
    return;
  } 
  else if (currentIndex < clampedTargetIndex) {
    // Moving DOWN - same logic as trips
    if (currentIndex === 0 && clampedTargetIndex === 1) {
      finalIndex = 1;
    } else {
      finalIndex = clampedTargetIndex - 1;
    }
  } 
  else {
    // Moving UP - same logic as trips
    finalIndex = clampedTargetIndex;
  }
  
  // Reorder the array
  const newPlaces = [...trip.places];
  const [moved] = newPlaces.splice(currentIndex, 1);
  newPlaces.splice(finalIndex, 0, moved);
  
  // Renumber places (1, 2, 3, ...) - intermediate places don't get numbers
  let numberCounter = 1;
  const renumberedPlaces = newPlaces.map(p => {
    if (p.isIntermediate) {
      return { ...p, assignedNumber: undefined };
    } else {
      return { ...p, assignedNumber: numberCounter++ };
    }
  });
}
```

---

## Visual Indicators

### Purple Drop Line
- Shows **above** the item at `dragOverIndex`
- Only shows when:
  - An item is being dragged
  - The dragged item is not the same as the hovered item
  - The line is not at the dragged item's current position or adjacent position

### Code for Drop Indicator:
```typescript
const showDropIndicatorAbove = draggedTripId && 
                              draggedTripId !== trip.id && 
                              dragOverIndex === tripIndex && 
                              !isAtDraggedPosition && 
                              !isAtAdjacentPosition;
```

---

## Common Issues & Solutions

### Issue 1: "Item not moving to the right position"
**Cause**: The `finalIndex` calculation doesn't account for array shifts after removal.
**Solution**: The logic handles this differently for moving DOWN vs UP.

### Issue 2: "Flickering drop indicator"
**Cause**: Rapid updates to `dragOverIndex` when cursor is near item boundaries.
**Solution**: 
- **Trip Lists**: 5px deadzone prevents flickering
- **Places**: Conditional updates (`if (dragOverPlaceIndex !== clampedTarget)`)

### Issue 3: "Bottom-to-top dragging not working"
**Cause**: `onDragLeave` was clearing `dragOverIndex` prematurely.
**Solution**: 
- **Trip Lists**: Only clear when truly leaving the element boundaries
- **Places**: Never clear `dragOverPlaceIndex` in `onDragLeave` (only on drop/end)

---

## Summary

1. **Drag Start**: Store item ID and set dragged state
2. **Drag Over**: Calculate target index based on cursor position (with deadzone for trips)
3. **Visual Feedback**: Show purple line above target item
4. **Drop**: Calculate final index accounting for array shifts
5. **Update**: Remove item from old position, insert at new position
6. **Renumber**: For places, renumber sequentially (intermediate places excluded)

The key insight is that **when moving DOWN, the array shifts after removal**, so we need to subtract 1 from the target index. When moving UP, the array doesn't shift for items before the removal point, so we use the target index directly.

