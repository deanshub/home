package main

import (
	"bufio"
	"fmt"
	"gopkg.in/yaml.v2"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type Config struct {
	Services []Service `yaml:"services"`
}

type Service struct {
	Name     string `yaml:"name"`
	Label    string `yaml:"label,omitempty"`
	Category string `yaml:"category,omitempty"`
	Color    string `yaml:"color,omitempty"`
	URL      string `yaml:"url,omitempty"`
}

func main() {
	if len(os.Args) < 2 {
		showHelp()
		return
	}

	switch os.Args[1] {
	case "--help", "-h", "help":
		showHelp()
	case "config":
		runConfig()
	case "up":
		runServiceCommand("up", os.Args[2:])
	case "down":
		runServiceCommand("down", os.Args[2:])
	case "restart":
		runServiceCommand("restart", os.Args[2:])
	case "log":
		if len(os.Args) > 2 {
			runServiceLog(os.Args[2])
		}
	case "status":
		runServiceCommand("status", os.Args[2:])
	case "install":
		if len(os.Args) > 2 {
			runServiceInstall(os.Args[2])
		} else {
			runInteractiveInstall()
		}
	default:
		fmt.Printf("Unknown command: %s\n\n", os.Args[1])
		showHelp()
	}
}

func getRepoRoot() string {
	execPath, err := os.Executable()
	if err != nil {
		fmt.Printf("Error getting executable path: %v\n", err)
		os.Exit(1)
	}
	return filepath.Dir(execPath)
}

func loadConfig() (*Config, error) {
	configPath := filepath.Join(getRepoRoot(), "config.yaml")
	data, err := ioutil.ReadFile(configPath)
	if err != nil {
		return nil, err
	}

	var config Config
	err = yaml.Unmarshal(data, &config)
	return &config, err
}

func runConfig() {
	scriptDir := filepath.Join(getRepoRoot(), "ansible", "bun-script")

	cmd := exec.Command("bun", "run", "generate-caddyfile.ts")
	cmd.Dir = scriptDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		fmt.Printf("Error running bun script: %v\n", err)
		os.Exit(1)
	}
}

func runServiceCommand(action string, args []string) {
	if len(args) > 0 {
		runSingleService(action, args[0])
	} else {
		runAllServices(action)
	}
}

func runSingleService(action, serviceName string) {
	serviceDir := filepath.Join(getRepoRoot(), "services", serviceName)

	var cmd *exec.Cmd
	switch action {
	case "up":
		fmt.Printf("Starting %s...\n", serviceName)
		cmd = exec.Command("docker", "compose", "up", "-d")
	case "down":
		fmt.Printf("Stopping %s...\n", serviceName)
		cmd = exec.Command("docker", "compose", "down")
	case "restart":
		fmt.Printf("Restarting %s...\n", serviceName)
		cmd = exec.Command("docker", "compose", "restart")
	case "status":
		cmd = exec.Command("docker", "compose", "ps")
	}

	cmd.Dir = serviceDir

	if action == "status" {
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			fmt.Printf("Error getting status for %s: %v\n", serviceName, err)
		}
		return
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("❌ %s: FAILED - %v\n%s\n", serviceName, err, string(output))
	} else {
		fmt.Printf("✅ %s: SUCCESS\n", serviceName)
	}
}

func runAllServices(action string) {
	config, err := loadConfig()
	if err != nil {
		fmt.Printf("Error loading config: %v\n", err)
		os.Exit(1)
	}

	if action == "status" {
		for _, service := range config.Services {
			fmt.Printf("=== %s ===\n", service.Name)
			runSingleService(action, service.Name)
			fmt.Println()
		}
		return
	}

	var succeeded, failed []string

	for _, service := range config.Services {
		serviceDir := filepath.Join(getRepoRoot(), "services", service.Name)

		var cmd *exec.Cmd
		switch action {
		case "up":
			fmt.Printf("Starting %s...\n", service.Name)
			cmd = exec.Command("docker", "compose", "up", "-d")
		case "down":
			fmt.Printf("Stopping %s...\n", service.Name)
			cmd = exec.Command("docker", "compose", "down")
		case "restart":
			fmt.Printf("Restarting %s...\n", service.Name)
			cmd = exec.Command("docker", "compose", "restart")
		}

		cmd.Dir = serviceDir
		output, err := cmd.CombinedOutput()

		if err != nil {
			fmt.Printf("❌ %s: FAILED - %v\n", service.Name, err)
			if len(output) > 0 {
				fmt.Printf("Output: %s\n", string(output))
			}
			failed = append(failed, fmt.Sprintf("%s: %v", service.Name, err))
		} else {
			fmt.Printf("✅ %s: SUCCESS\n", service.Name)
			succeeded = append(succeeded, service.Name)
		}
	}

	fmt.Printf("\n=== SUMMARY ===\n")
	fmt.Printf("✅ Succeeded (%d): %v\n", len(succeeded), succeeded)
	if len(failed) > 0 {
		fmt.Printf("❌ Failed (%d):\n", len(failed))
		for _, f := range failed {
			fmt.Printf("  - %s\n", f)
		}
	}
}

func runServiceLog(serviceName string) {
	serviceDir := filepath.Join(getRepoRoot(), "services", serviceName)

	cmd := exec.Command("docker", "compose", "logs", "-f")
	cmd.Dir = serviceDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		fmt.Printf("Error viewing logs for %s: %v\n", serviceName, err)
		os.Exit(1)
	}
}

func parseComposeLabels(composePath string) map[string]string {
	composeData, err := ioutil.ReadFile(composePath)
	if err != nil {
		return nil
	}

	var compose struct {
		Services map[string]struct {
			Labels map[string]string `yaml:"labels"`
		} `yaml:"services"`
	}

	if yaml.Unmarshal(composeData, &compose) != nil {
		return nil
	}

	for _, service := range compose.Services {
		return service.Labels
	}
	return nil
}

func runServiceInstall(serviceName string) {
	repoRoot := getRepoRoot()
	composePath := filepath.Join(repoRoot, "services", serviceName, "compose.yml")

	labels := parseComposeLabels(composePath)
	if labels == nil || labels["url"] == "" {
		fmt.Printf("Service %s has no URL label, skipping\n", serviceName)
		return
	}

	// Create volume directories
	createVolumeDirectories(composePath)

	configPath := filepath.Join(repoRoot, "config.yaml")
	configData, err := ioutil.ReadFile(configPath)
	if err != nil {
		fmt.Printf("Error reading config.yaml: %v\n", err)
		os.Exit(1)
	}

	var config struct {
		StaticIP  string    `yaml:"static_ip"`
		Username  string    `yaml:"username"`
		GatewayIP string    `yaml:"gateway_ip"`
		Domain    string    `yaml:"domain"`
		Services  []Service `yaml:"services"`
	}

	if yaml.Unmarshal(configData, &config) != nil {
		fmt.Printf("Error parsing config.yaml\n")
		os.Exit(1)
	}

	// Check if service already exists
	for _, service := range config.Services {
		if service.Name == serviceName {
			fmt.Printf("Service %s already installed\n", serviceName)
			return
		}
	}

	// Add new service
	url := labels["url"]
	if url != "" && strings.Contains(url, "{{ domain }}") {
		url = strings.ReplaceAll(url, "{{ domain }}", config.Domain)
	}

	newService := Service{
		Name:     serviceName,
		Label:    labels["title"],
		Category: labels["category"],
		Color:    labels["color"],
		URL:      url,
	}
	config.Services = append(config.Services, newService)

	// Write updated config
	updatedData, _ := yaml.Marshal(&config)
	ioutil.WriteFile(configPath, updatedData, 0644)

	fmt.Printf("✅ Service %s installed successfully\n", serviceName)

	runConfig()
	restartCaddy()

	// Start the service
	fmt.Printf("Starting %s...\n", serviceName)
	runSingleService("up", serviceName)
}

func createVolumeDirectories(composePath string) {
	data, err := ioutil.ReadFile(composePath)
	if err != nil {
		return
	}

	var compose struct {
		Services map[string]struct {
			Volumes []string `yaml:"volumes"`
		} `yaml:"services"`
	}

	yaml.Unmarshal(data, &compose)

	for _, service := range compose.Services {
		for _, volume := range service.Volumes {
			if strings.Contains(volume, ":") {
				hostPath := strings.Split(volume, ":")[0]
				if strings.HasPrefix(hostPath, "/") {
					os.MkdirAll(hostPath, 0755)
				}
			}
		}
	}
}

func runInteractiveInstall() {
	repoRoot := getRepoRoot()
	servicesDir := filepath.Join(repoRoot, "services")
	entries, err := ioutil.ReadDir(servicesDir)
	if err != nil {
		fmt.Printf("Error reading services directory: %v\n", err)
		os.Exit(1)
	}

	var availableServices []Service
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		composePath := filepath.Join(servicesDir, entry.Name(), "compose.yml")
		if _, err := os.Stat(composePath); err != nil {
			continue
		}

		labels := parseComposeLabels(composePath)
		if labels == nil {
			continue
		}

		service := Service{
			Name:     entry.Name(),
			Label:    labels["title"],
			Category: labels["category"],
			Color:    labels["color"],
			URL:      labels["url"],
		}
		availableServices = append(availableServices, service)
	}

	// Load existing config
	configPath := filepath.Join(repoRoot, "config.yaml")
	configData, _ := ioutil.ReadFile(configPath)

	var config struct {
		StaticIP  string    `yaml:"static_ip"`
		Username  string    `yaml:"username"`
		GatewayIP string    `yaml:"gateway_ip"`
		Domain    string    `yaml:"domain"`
		Services  []Service `yaml:"services"`
	}
	yaml.Unmarshal(configData, &config)

	// Create map of currently installed services
	installedServices := make(map[string]bool)
	for _, service := range config.Services {
		installedServices[service.Name] = true
	}

	// Interactive selection
	reader := bufio.NewReader(os.Stdin)
	var newServices []Service

	fmt.Println("Select services to install (Y/n for each):")

	for _, service := range availableServices {
		status := "not installed"
		if installedServices[service.Name] {
			status = "installed"
		}

		displayName := service.Label
		if displayName == "" {
			displayName = service.Name
		}

		fmt.Printf("Include %s (%s)? [Y/n]: ", displayName, status)
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(strings.ToLower(input))

		if input == "" || input == "y" || input == "yes" {
			url := service.URL
			if url != "" && strings.Contains(url, "{{ domain }}") {
				url = strings.ReplaceAll(url, "{{ domain }}", config.Domain)
			}

			serviceToAdd := Service{
				Name:     service.Name,
				Label:    service.Label,
				Category: service.Category,
				Color:    service.Color,
				URL:      url,
			}
			newServices = append(newServices, serviceToAdd)
		}
	}

	// Update config
	config.Services = newServices
	updatedData, _ := yaml.Marshal(&config)
	ioutil.WriteFile(configPath, updatedData, 0644)

	fmt.Printf("✅ Configuration updated with %d services\n", len(newServices))

	runConfig()
	restartCaddy()
}

func restartCaddy() {
	fmt.Println("Restarting caddy...")
	cmd := exec.Command("docker", "restart", "caddy")
	if err := cmd.Run(); err != nil {
		fmt.Printf("Warning: Failed to restart caddy: %v\n", err)
	} else {
		fmt.Println("✅ Caddy restarted successfully")
	}
}

func showHelp() {
	fmt.Println("Casa Controller - Docker Compose Service Manager")
	fmt.Println()
	fmt.Println("USAGE:")
	fmt.Println("  casa [COMMAND] [SERVICE_NAME]")
	fmt.Println()
	fmt.Println("COMMANDS:")
	fmt.Println("  Configuration:")
	fmt.Println("    config                    Generate Caddyfile from service configurations")
	fmt.Println()
	fmt.Println("  Service Management:")
	fmt.Println("    up [SERVICE_NAME]         Start all services or specific service")
	fmt.Println("    down [SERVICE_NAME]       Stop all services or specific service")
	fmt.Println("    restart [SERVICE_NAME]    Restart all services or specific service")
	fmt.Println()
	fmt.Println("  Service Installation:")
	fmt.Println("    install                   Interactive service selection")
	fmt.Println("    install SERVICE_NAME      Install specific service to config.yaml")
	fmt.Println()
	fmt.Println("  Monitoring:")
	fmt.Println("    status [SERVICE_NAME]     Show status of all or specific service")
	fmt.Println("    log SERVICE_NAME          View live logs for specific service")
	fmt.Println()
	fmt.Println("  Help:")
	fmt.Println("    --help, -h, help          Show this help message")
	fmt.Println()
	fmt.Println("EXAMPLES:")
	fmt.Println("  casa install              # Interactive service selection")
	fmt.Println("  casa up                   # Start all configured services")
	fmt.Println("  casa status portainer     # Check portainer status")
	fmt.Println("  casa log jellyfin         # View jellyfin logs")
}
