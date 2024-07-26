import {
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

const config = { activationConstraint: { distance: 5 } };

export const useCustomSensors = () => {
  return useSensors(
    useSensor(MouseSensor, config),
    useSensor(TouchSensor, config),
    useSensor(PointerSensor, config),
    useSensor(KeyboardSensor),
  );
};
