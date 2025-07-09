class TaskManager:
    def __init__(self):
        self.tasks = []

    def add_task(self, task):
        self.tasks.append(task)
        return f"✅ Added: {task}"

    def remove_task(self, index):
        try:
            removed = self.tasks.pop(index)
            return f"❌ Removed: {removed}"
        except IndexError:
            return "⚠️ Invalid index."

    def list_tasks(self):
        if not self.tasks:
            return ["📭 No tasks available."]
        return [f"{i + 1}. {task}" for i, task in enumerate(self.tasks)]
