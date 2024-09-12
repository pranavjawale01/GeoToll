1. **Clone the repository:**
   ```bash
   git clone https://github.com/username/repository.git
   ```
   
2. **Check the status of branch:**
    ```bash
    git status
    ```

3. **Add changes to the staging area:**
    ```bash
    git add <file>
    ```
    # or add all changes
    ```bash
    git add .
    ```

4. **Commit changes:**
    ```bash
    git commit -m "Your commit message"
    ```

5. **View commit history:**
    ```bash
    git log
    ```

6. **To create a new local branch from the remote one:**

   ```bash
   git checkout -b <local-branch-name> origin/<remote-branch-name>
   ```

7. **Create a new branch:**
    ```bash
    git branch <branch-name>
    ```

8. **Switch to a branch:**
    ```bash
    git checkout <branch-name>
    ```

9. **Merge a branch into the current branch:**
    ```bash
    git checkout <branch-name>  # Switch to the branch you want to merge into
    git merge <branch-name>     # Merge the specified branch into the current branch
    ```

10. **Pull the latest changes from the remote repository:**
    ```bash
    git pull
    ```

10. **Push changes to the remote repository:**
    ```bash
    git push origin <branch-name>
    ```

# If you have any other commands please contribute 🦭
