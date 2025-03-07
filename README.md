# Home

## Usage

1. clone
2. set env files
3. build

```bash
docker-compose build
```

4. run

```bash
docker-compose up -d
```

---

## **Automatic Refresh with `update-repo.sh`**

### **Purpose**

This script pulls the latest changes from Git and restarts the Docker services.

### **Usage**

Run manually:

```sh
./update-repo.sh
```

Schedule it with **cron** (e.g., run at 9 AM and 9 PM daily):

```sh
crontab -e
```

Add the following line:

```sh
0 4,16 * * * /home/dean/dev/home/update-repo.sh
```
