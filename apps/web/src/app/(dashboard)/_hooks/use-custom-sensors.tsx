import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

const config = { activationConstraint: { distance: 5 } };

export const useCustomSensors = () => {
  return useSensors(
    useSensor(PointerSensor, config),
    useSensor(KeyboardSensor),
  );
};
