import { db } from '@/lib/configs/firebase';
import { v4 as uuidv4 } from 'uuid';
import { withAuth } from '@/utils/withAuth';
import { NextResponse } from 'next/server';

// Helper function to update spots with layout information
const updateSpotsWithLayoutInfo = async (layoutId, grid) => {
  // First, get all spots that currently have this layoutId and clear their positions
  const currentSpotsSnapshot = await db.ref('spots')
    .orderByChild('layoutId')
    .equalTo(layoutId)
    .once('value');
  const currentSpots = currentSpotsSnapshot.val() || {};

  // Clear layout info for spots that are no longer in this layout
  const spotsToClear = Object.keys(currentSpots);
  const spotsInGrid = new Set();

  // Collect all spotIds currently in the grid
  if (grid && Array.isArray(grid)) {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const cell = grid[row][col];
        if (cell && cell.type === 'slot' && cell.spotId) {
          spotsInGrid.add(cell.spotId);
        }
      }
    }
  }

  // Update spots that are in the grid with their positions
  for (const spotId of spotsInGrid) {
    // Find the spot's position in the grid
    let rowNo = null;
    let columnNo = null;

    if (grid && Array.isArray(grid)) {
      for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
          const cell = grid[row][col];
          if (cell && cell.type === 'slot' && cell.spotId === spotId) {
            rowNo = row + 1; // 1-based indexing
            columnNo = col + 1; // 1-based indexing
            break;
          }
        }
        if (rowNo !== null) break;
      }
    }

    // Update the spot with layout information
    await db.ref(`spots/${spotId}`).update({
      layoutId,
      rowNo,
      columnNo,
      updatedAt: Date.now(),
    });

    // Remove from spots to clear list
    const index = spotsToClear.indexOf(spotId);
    if (index > -1) {
      spotsToClear.splice(index, 1);
    }
  }

  // Clear layout info for spots that are no longer in this layout
  for (const spotId of spotsToClear) {
    await db.ref(`spots/${spotId}`).update({
      layoutId: null,
      rowNo: null,
      columnNo: null,
      updatedAt: Date.now(),
    });
  }
};

const getLayoutsHandler = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const lotId = searchParams.get('lotId');
    const layoutId = searchParams.get('layoutId');

    if (layoutId) {
      const snapshot = await db.ref(`layouts/${layoutId}`).once('value');
      const layout = snapshot.val();
      if (!layout) {
        return NextResponse.json({ error: 'Layout not found' }, { status: 404 });
      }
      // Check ownership: user must be the owner
      if (layout.ownerId !== req.user.uid) {
        return NextResponse.json({ error: 'Forbidden — you do not own this layout' }, { status: 403 });
      }
      return NextResponse.json({ data: { layoutId, ...layout } });
    }

    if (lotId) {
      const snapshot = await db
        .ref('layouts')
        .orderByChild('lotId')
        .equalTo(lotId)
        .once('value');
      const data = snapshot.val();
      if (!data) {
        return NextResponse.json({ data: [] });
      }
      const layouts = Object.entries(data)
        .filter(([id, layout]) => layout.ownerId === req.user.uid)
        .map(([id, layout]) => ({
          layoutId: id,
          ...layout,
        }));
      return NextResponse.json({ data: layouts });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error in GET /api/layouts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

const createLayoutHandler = withAuth(async (req) => {
  try {
    const body = await req.json();
    const { lotId, layoutName, notes, rows, cols, grid, floor } = body;

    if (!lotId) {
      return NextResponse.json({ error: 'lotId is required' }, { status: 400 });
    }

    const layoutId = uuidv4();
    const layout = {
      lotId,
      layoutName: layoutName || 'Untitled Layout',
      notes: notes || '',
      floor: floor || '1',
      totalRows: rows || 0,
      totalColumns: cols || 0,
      grid: grid || [],
      ownerId: req.user.uid,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.ref(`layouts/${layoutId}`).set(layout);

    // Update spots with layout information
    await updateSpotsWithLayoutInfo(layoutId, grid);

    return NextResponse.json({ data: { layoutId, ...layout } }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/layouts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

const updateLayoutHandler = withAuth(async (req) => {
  try {
    const body = await req.json();
    const { layoutId, layoutName, notes, totalRows, totalColumns, grid, isActive } = body;

    if (!layoutId) {
      return NextResponse.json({ error: 'layoutId is required' }, { status: 400 });
    }

    const sanitized = {};

    if (layoutName !== undefined) sanitized.layoutName = layoutName;
    if (notes !== undefined) sanitized.notes = notes;
    if (totalRows !== undefined) sanitized.totalRows = totalRows;
    if (totalColumns !== undefined) sanitized.totalColumns = totalColumns;
    if (grid !== undefined) sanitized.grid = grid;
    if (isActive !== undefined) sanitized.isActive = isActive;

    sanitized.updatedAt = Date.now();

    await db.ref(`layouts/${layoutId}`).update(sanitized);

    // Update spots with layout information if grid was updated
    if (grid !== undefined) {
      await updateSpotsWithLayoutInfo(layoutId, grid);
    }

    return NextResponse.json({ data: { layoutId, ...sanitized } });
  } catch (error) {
    console.error('Error in PATCH /api/layouts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

const deleteLayoutHandler = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const layoutId = searchParams.get('layoutId');

    if (!layoutId) {
      return NextResponse.json({ error: 'layoutId is required' }, { status: 400 });
    }

    await db.ref(`layouts/${layoutId}`).remove();

    // Clear layout information from all spots that were in this layout
    const spotsSnapshot = await db.ref('spots')
      .orderByChild('layoutId')
      .equalTo(layoutId)
      .once('value');
    const spots = spotsSnapshot.val() || {};

    const updatePromises = Object.keys(spots).map(spotId =>
      db.ref(`spots/${spotId}`).update({
        layoutId: null,
        rowNo: null,
        columnNo: null,
        updatedAt: Date.now(),
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ data: { layoutId, deleted: true } });
  } catch (error) {
    console.error('Error in DELETE /api/layouts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const GET = getLayoutsHandler;
export const POST = createLayoutHandler;
export const PATCH = updateLayoutHandler;
export const DELETE = deleteLayoutHandler;
