import unittest
from app.tasks_manager import TaskManager

class TestTaskManager(unittest.TestCase):

    def setUp(self):
        self.tm = TaskManager()

    def test_add_task(self):
        result = self.tm.add_task("Buy milk")
        self.assertEqual(result, "✅ Added: Buy milk")
        self.assertEqual(len(self.tm.tasks), 1)
        self.assertEqual(self.tm.tasks[0], "Buy milk")

    def test_list_tasks_empty(self):
        self.assertEqual(self.tm.list_tasks(), ["📭 No tasks available."])

    def test_list_tasks_non_empty(self):
        self.tm.add_task("Read book")
        self.assertEqual(self.tm.list_tasks(), ["1. Read book"])

    def test_remove_valid_task(self):
        self.tm.add_task("Walk dog")
        result = self.tm.remove_task(0)
        self.assertEqual(result, "❌ Removed: Walk dog")
        self.assertEqual(len(self.tm.tasks), 0)

    def test_remove_invalid_task(self):
        result = self.tm.remove_task(99)
        self.assertEqual(result, "⚠️ Invalid index.")

if __name__ == "__main__":
    unittest.main()
