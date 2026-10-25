function handleDoneToggle(task: Task) {
  const nextStatus: Task["status"] = task.status === "Done" ? "Open" : "Done";

  const nextTask: Task = {
    ...task,
    status: nextStatus,
  };

  setTaskList((current) =>
    current.map((item) => (item.id === task.id ? nextTask : item))
  );
}
