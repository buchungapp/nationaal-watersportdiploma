"use client";

export function PermissionDialog({
  open,
  onClose,
  params,
}: {
  open: boolean;
  onClose: () => void;
  params: Promise<{ location: string; handle: string }>;
}) {
  // TODO: Implement permission dialog
  return null;
}
