import { auth } from '@/lib/configs/firebaseClient';

export async function getLayoutsByLot(lotId) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const token = await user.getIdToken();
    const res = await fetch(`/api/layouts?lotId=${lotId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Failed to fetch layouts');
    const response = await res.json();
    return response.data || [];
  } catch (error) {
    console.error('Error fetching layouts:', error);
    throw error;
  }
}

export async function getLayoutById(layoutId) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const token = await user.getIdToken();
    const res = await fetch(`/api/layouts?layoutId=${layoutId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Layout not found');
    const response = await res.json();
    return response.data;
  } catch (error) {
    console.error('Error fetching layout:', error);
    throw error;
  }
}

export async function createLayout(lotId, data) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const token = await user.getIdToken();
    const res = await fetch('/api/layouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        lotId,
        layoutName: data.layoutName,
        notes: data.notes,
        rows: data.rows,
        cols: data.cols,
        grid: data.grid,
        floor: data.floor,
      }),
    });

    if (!res.ok) throw new Error('Failed to create layout');
    const response = await res.json();
    return response.data;
  } catch (error) {
    console.error('Error creating layout:', error);
    throw error;
  }
}

export async function updateLayout(layoutId, updates) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const token = await user.getIdToken();
    const res = await fetch('/api/layouts', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        layoutId,
        ...updates,
      }),
    });

    if (!res.ok) throw new Error('Failed to update layout');
    const response = await res.json();
    return response.data;
  } catch (error) {
    console.error('Error updating layout:', error);
    throw error;
  }
}

export async function deleteLayout(layoutId) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const token = await user.getIdToken();
    const res = await fetch(`/api/layouts?layoutId=${layoutId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Failed to delete layout');
    const response = await res.json();
    return response.data;
  } catch (error) {
    console.error('Error deleting layout:', error);
    throw error;
  }
}
