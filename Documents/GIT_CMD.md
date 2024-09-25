1. **Clone the repository:**
   ```bash
   git clone https://github.com/username/repository.git
   ```

2. **View Branches:**
   ```bash
   git branch
   ```
   or to view all local and global branches
   ```bash
   git branch -a
   ```

3. **To create a new local branch from the remote one:**

   ```bash
   git checkout -b <local-branch-name> origin/<remote-branch-name>
   ```
   
4. **Create Branch**
    ```bash
    git branch <branch-name>
    ```
    
5. **Jump from one branch to another:**
   ```bash
   git checkout <branch-name>
   ```
   
6. **Pull the changes from origin branch to local branch:**
   ```bash
   git checkout <branch-name>  # Switch to the branch you want to merge into
   git pull origin <branch-name>     
   ```
   
7. **Check the status of branch:**
    ```bash
    git status
    ```

8. **Add changes to the staging area:**
    ```bash
    git add <file>
    ```
    or add all changes
    ```bash
    git add .
    ```

9. **Commit changes:**
    ```bash
    git commit -m "Your commit message"
    ```

10. **Push changes to the remote repository:**
    ```bash
    git push origin <branch-name>
    ```

11. **View commit history:**
    ```bash
    git log
    ```

13. **Merge a local branch into the current local branch:**
   ```bash
   git checkout <branch-name>  # Switch to the branch you want to merge into
   git merge <branch-name>     # Merge the specified branch into the current branch
   ```

# If you have any other commands please contribute 🦭
