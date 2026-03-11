"use client";

import { useStressStore } from "@/store/stressStore";
import TaskKanban from "./TaskKanban";
import TaskList from "./TaskList";
import TaskDetail from "./TaskDetail";

export default function TaskInterface() {
  const currentLevel = useStressStore((state) => state.currentLevel);

  switch (currentLevel) {
    case 0:
    case 1:
      return <TaskKanban />;
    case 2:
      return <TaskList />;
    case 3:
      return <TaskDetail />;
    case 4:
      return null;
    default:
      return <TaskKanban />;
  }
}
