"use client";

import { useEffect, useState } from "react";
import {
  usePermissionStore,
  type PermissionState,
} from "@/store/permissionStore";

export function usePermissionStatus(): PermissionState {
  const [permission, setPermission] = useState<PermissionState>("prompt");
  const storePermission = usePermissionStore((state) => state.cameraPermission);
  const checkCameraPermission = usePermissionStore(
    (state) => state.checkCameraPermission
  );

  useEffect(() => {
    setPermission(storePermission);
    void checkCameraPermission();
  }, [storePermission, checkCameraPermission]);

  useEffect(() => {
    const unsubscribe = usePermissionStore.subscribe((state) => {
      setPermission(state.cameraPermission);
    });
    return unsubscribe;
  }, []);

  return permission;
}
