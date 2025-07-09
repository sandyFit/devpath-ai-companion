from app.tasks_manager import TaskManager

def run_cli():
    manager = TaskManager()

    while True:
        print("\n📋 TODO Menu:")
        print("1. View tasks")
        print("2. Add task")
        print("3. Remove task")
        print("4. Exit")

        choice = input("Choose an option: ").strip()

        if choice == "1":
            print("\n".join(manager.list_tasks()))
        elif choice == "2":
            task = input("Enter new task: ").strip()
            print(manager.add_task(task))
        elif choice == "3":
            try:
                idx = int(input("Enter task number to remove: ")) - 1
                print(manager.remove_task(idx))
            except ValueError:
                print("⚠️ Invalid input.")
        elif choice == "4":
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid option.")
