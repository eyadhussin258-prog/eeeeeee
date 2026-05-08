// Hair Server - FiveM Website JavaScript

// Discord OAuth Configuration
const DISCORD_CONFIG = {
    CLIENT_ID: '1496988349762900029',
    CLIENT_SECRET: '_LqMIK2TJXYr6wf4idfJis8bYkz8cfu6',
    REDIRECT_URI: 'https://your-domain.com/callback',
    SCOPE: 'identify email guilds',
    API_BASE: 'https://discord.com/api/v10',
    OAUTH_BASE: 'https://discord.com/oauth2/authorize'
};

// Global Variables
let currentUser = null;
let applications = [];
let vehicles = [];
let players = [];
let serverSettings = {
    welcomeMessage: "مرحباً بك في 𝐏𝐞𝐫𝐟𝐞𝐜𝐭 𝐂𝐅𝐖 - أفضل سيرفر FiveM عربي",
    discordLink: "https://discord.gg/perfectcfw"
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Load saved data
    loadSavedData();
    
    // Check for Discord auth code
    checkDiscordAuth();
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize Discord login
    initializeDiscordLogin();
    
    // Load sample data
    loadSampleData();
    
    // Initialize admin panel
    initializeAdminPanel();
    
    // Initialize modals
    initializeModals();
    
    // Load reviews and polls
    loadReviews();
    loadPolls();
    
    // Initialize rating stars
    initializeRatingStars();
    
    // Start real-time updates
    startRealTimeUpdates();
    
    // Initialize animations
    initializeAnimations();
}

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Smooth scroll to section
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Update active nav on scroll
    window.addEventListener('scroll', updateActiveNav);
}

function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// Discord OAuth Integration
function initializeDiscordLogin() {
    const discordBtn = document.getElementById('discord-login');
    const userProfile = document.getElementById('user-profile');
    
    discordBtn.addEventListener('click', function() {
        // Initiate real Discord OAuth
        initiateDiscordLogin();
    });

        
    // Check if user is already logged in
    const savedUser = localStorage.getItem('hairServerUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserProfile();
    }
}

function initiateDiscordLogin() {
    try {
        showNotification('جاري فتح نافذة ديسكورد...', 'info');
        
        // Build Discord OAuth URL
        const params = new URLSearchParams({
            client_id: DISCORD_CONFIG.CLIENT_ID,
            redirect_uri: DISCORD_CONFIG.REDIRECT_URI,
            response_type: 'code',
            scope: DISCORD_CONFIG.SCOPE,
            prompt: 'consent' // Force consent screen
        });
        
        const authUrl = `${DISCORD_CONFIG.OAUTH_BASE}?${params.toString()}`;
        
        console.log('Discord Auth URL:', authUrl);
        console.log('Client ID:', DISCORD_CONFIG.CLIENT_ID);
        console.log('Redirect URI:', DISCORD_CONFIG.REDIRECT_URI);
        
        // Open Discord OAuth in popup
        const popup = window.open(authUrl, 'discord_oauth', 'width=500,height=600,scrollbars=yes,resizable=yes');
        
        if (!popup) {
            showNotification('فشل فتح النافذة. يرجى التحقق من إعدادات المتصفح', 'error');
            return;
        }
        
        // Listen for messages from popup
        const messageHandler = function(event) {
            if (event.origin === window.location.origin) {
                console.log('Received message:', event.data);
                
                if (event.data.type === 'discord_auth_success') {
                    handleDiscordCallback(event.data.code);
                    popup.close();
                    window.removeEventListener('message', messageHandler);
                } else if (event.data.type === 'discord_auth_error') {
                    showNotification('فشل تسجيل الدخول: ' + event.data.error, 'error');
                    popup.close();
                    window.removeEventListener('message', messageHandler);
                }
            }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Check if popup was closed
        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
                window.removeEventListener('message', messageHandler);
                showNotification('تم إغلاق نافذة تسجيل الدخول', 'info');
            }
        }, 1000);
        
    } catch (error) {
        console.error('Discord login error:', error);
        showNotification('حدث خطأ أثناء محاولة تسجيل الدخول', 'error');
    }
}

async function handleDiscordCallback(code) {
    try {
        showNotification('جاري تسجيل الدخول بحساب ديسكورد...', 'info');
        
        // Exchange code for access token
        const tokenResponse = await exchangeCodeForToken(code);
        
        if (tokenResponse.access_token) {
            // Get user information
            const userInfo = await getUserInfo(tokenResponse.access_token);
            
            // Check if user is server owner
            const isOwner = userInfo.id === '1494445191665549312'; // Owner Discord ID
            
            // Check user role in server
            const userRole = checkUserRole(userInfo.id, userInfo.guilds || []);
            
            currentUser = {
                id: userInfo.id,
                username: userInfo.username,
                discriminator: userInfo.discriminator,
                avatar: userInfo.avatar ? `https://cdn.discordapp.com/avatars/${userInfo.id}/${userInfo.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${userInfo.id}/${userInfo.discriminator}.png`,
                email: userInfo.email,
                isOwner: isOwner,
                isAdmin: userRole.isAdmin,
                serverName: userRole.serverName,
                permissions: userRole.permissions
            };
            
            // Save user data
            localStorage.setItem('hairServerUser', JSON.stringify(currentUser));
            localStorage.setItem('hairServerToken', tokenResponse.access_token);
            
            // Update UI
            updateUserProfile();
            
            showNotification('تم تسجيل الدخول بنجاح!', 'success');
        } else {
            showNotification('فشل تسجيل الدخول', 'error');
        }
    } catch (error) {
        console.error('Discord OAuth Error:', error);
        showNotification('حدث خطأ أثناء تسجيل الدخول', 'error');
    }
}

async function exchangeCodeForToken(code) {
    const response = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: DISCORD_CONFIG.CLIENT_ID,
            client_secret: DISCORD_CONFIG.CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: DISCORD_CONFIG.REDIRECT_URI
        })
    });
    
    return await response.json();
}

async function getUserInfo(accessToken) {
    // Get user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    const userInfo = await userResponse.json();
    
    // Get user guilds to check roles
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    const guilds = await guildsResponse.json();
    
    // Add guild info to user data
    userInfo.guilds = guilds;
    
    return userInfo;
}

// Function to check if user has specific role in server
function checkUserRole(userId, guilds) {
    // Check if user is in specific Discord servers (you can add server IDs)
    const allowedServers = ['YOUR_SERVER_ID']; // Add your Discord server ID
    
    for (const guild of guilds) {
        if (allowedServers.includes(guild.id)) {
            return {
                isAdmin: true,
                serverName: guild.name,
                permissions: guild.permissions
            };
        }
    }
    
    return {
        isAdmin: false,
        serverName: null,
        permissions: 0
    };
}

function updateUserProfile() {
    const discordBtn = document.getElementById('discord-login');
    const userProfile = document.getElementById('user-profile');
    const adminLink = document.getElementById('admin-link');
    
    if (currentUser) {
        // Hide login button, show profile
        discordBtn.style.display = 'none';
        userProfile.style.display = 'flex';
        
        // Update profile info
        userProfile.querySelector('.user-avatar').src = currentUser.avatar;
        userProfile.querySelector('.user-name').textContent = currentUser.username;
        
        // Show admin link if user is owner
        if (currentUser.isOwner) {
            adminLink.style.display = 'block';
        }
    } else {
        // Show login button, hide profile
        discordBtn.style.display = 'flex';
        userProfile.style.display = 'none';
        adminLink.style.display = 'none';
    }
}

// Load sample data
function loadSampleData() {
    // Empty vehicles array - store is empty
    vehicles = [];
    
    // Sample team members
    const teamMembers = [
        {
            id: 1,
            name: 'Ahmed Server',
            role: 'مالك السيرفر',
            avatar: 'https://picsum.photos/seed/admin1/100/100',
            status: 'متصل'
        },
        {
            id: 2,
            name: 'Mohamed Admin',
            role: 'مدير عام',
            avatar: 'https://picsum.photos/seed/admin2/100/100',
            status: 'متصل'
        },
        {
            id: 3,
            name: 'Sara Moderator',
            role: 'مشرف',
            avatar: 'https://picsum.photos/seed/admin3/100/100',
            status: 'متصل'
        },
        {
            id: 4,
            name: 'Khaled Support',
            role: 'دعم فني',
            avatar: 'https://picsum.photos/seed/admin4/100/100',
            status: 'غير متصل'
        }
    ];
    
    // Load store items
    loadStoreItems();
    
    // Load team members
    loadTeamMembers(teamMembers);
    
    // Load sample applications
    loadSampleApplications();
}

function loadStoreItems() {
    const storeGrid = document.getElementById('store-grid');
    if (!storeGrid) return;
    
    if (vehicles.length === 0) {
        storeGrid.innerHTML = `
            <div class="empty-store" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-store" style="font-size: 4rem; color: var(--text-muted); margin-bottom: 1rem; display: block;"></i>
                <h3 style="color: var(--text-secondary); margin-bottom: 0.5rem;">المتجر فارغ حالياً</h3>
                <p style="color: var(--text-muted);">سيتم إضافة المنتجات قريباً</p>
            </div>
        `;
    } else {
        storeGrid.innerHTML = vehicles.map(vehicle => `
            <div class="store-item">
                <img src="${vehicle.image}" alt="${vehicle.name}" class="store-image">
                <div class="store-info">
                    <h3>${vehicle.name}</h3>
                    <div class="store-price">${vehicle.price}</div>
                    <p class="store-description">${vehicle.description}</p>
                    <button class="btn btn-primary" onclick="purchaseVehicle(${vehicle.id})">
                        <i class="fas fa-shopping-cart"></i>
                        شراء الآن
                    </button>
                </div>
            </div>
        `).join('');
    }
}

function loadTeamMembers(members) {
    const teamGrid = document.getElementById('team-grid');
    if (!teamGrid) return;
    
    teamGrid.innerHTML = members.map(member => `
        <div class="team-member">
            <img src="${member.avatar}" alt="${member.name}" class="team-avatar">
            <h3>${member.name}</h3>
            <div class="team-role">${member.role}</div>
            <span class="team-status">${member.status}</span>
        </div>
    `).join('');
}

function loadSampleApplications() {
    applications = [
        {
            id: 1,
            type: 'admin',
            name: 'Ali Hassan',
            email: 'ali@example.com',
            age: 22,
            reason: 'أريد أن أصبح إداري لمساعدة اللاعبين وتحسين السيرفر',
            experience: 'لدي خبرة سنة في إدارة سيرفرات FiveM',
            status: 'pending',
            date: new Date().toISOString()
        },
        {
            id: 2,
            type: 'activation',
            name: 'Omar Khaled',
            email: 'omar@example.com',
            age: 19,
            reason: 'أريد تفعيل حسابي لأبدأ اللعب',
            experience: 'لاعب جديد في FiveM',
            status: 'pending',
            date: new Date().toISOString()
        }
    ];
}

// Admin Panel Functions
function initializeAdminPanel() {
    const adminLink = document.getElementById('admin-link');
    const adminPanel = document.getElementById('admin-panel');
    
    if (adminLink) {
        adminLink.addEventListener('click', function(e) {
            e.preventDefault();
            openAdminPanel();
        });
    }
}

function openAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.style.display = 'flex';
        loadAdminData();
    }
}

function closeAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.style.display = 'none';
    }
}

function switchAdminTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`admin-${tabName}`).classList.add('active');
    
    // Load tab-specific data
    switch(tabName) {
        case 'applications':
            loadAdminApplications();
            break;
        case 'vehicles':
            loadAdminVehicles();
            break;
        case 'players':
            loadAdminPlayers();
            break;
        case 'settings':
            loadAdminSettings();
            break;
    }
}

function loadAdminData() {
    loadAdminApplications();
    loadAdminVehicles();
    loadAdminPlayers();
    loadAdminSettings();
}

function loadAdminApplications() {
    const applicationsList = document.getElementById('admin-applications-list');
    if (!applicationsList) return;
    
    if (applications.length === 0) {
        applicationsList.innerHTML = '<p>لا توجد تقديمات حالياً</p>';
        return;
    }
    
    applicationsList.innerHTML = applications.map(app => `
        <div class="application-item" style="background: var(--card-bg); padding: 1.5rem; border-radius: 1rem; margin-bottom: 1rem; border: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                    <h4 style="color: var(--text-primary); margin-bottom: 0.5rem;">${app.name}</h4>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">${app.email} • ${app.age} سنة</p>
                </div>
                <span style="padding: 0.25rem 1rem; background: ${app.status === 'pending' ? 'var(--warning-color)' : 'var(--success-color)'}; color: white; border-radius: 2rem; font-size: 0.8rem;">
                    ${app.status === 'pending' ? 'قيد المراجعة' : 'تم الرد'}
                </span>
            </div>
            <div style="margin-bottom: 1rem;">
                <p style="color: var(--text-secondary); margin-bottom: 0.5rem;"><strong>السبب:</strong> ${app.reason}</p>
                <p style="color: var(--text-secondary);"><strong>الخبرة:</strong> ${app.experience}</p>
            </div>
            <div style="display: flex; gap: 1rem;">
                <button class="btn btn-primary" onclick="acceptApplication(${app.id})">قبول</button>
                <button class="btn btn-secondary" onclick="rejectApplication(${app.id})">رفض</button>
                <button class="btn btn-secondary" onclick="editApplication(${app.id})">تعديل</button>
            </div>
        </div>
    `).join('');
}

function loadAdminVehicles() {
    const vehiclesList = document.getElementById('admin-vehicles-list');
    if (!vehiclesList) return;
    
    vehiclesList.innerHTML = vehicles.map(vehicle => `
        <div class="vehicle-item" style="background: var(--card-bg); padding: 1.5rem; border-radius: 1rem; margin-bottom: 1rem; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 1.5rem;">
            <img src="${vehicle.image}" alt="${vehicle.name}" style="width: 100px; height: 75px; object-fit: cover; border-radius: 0.5rem;">
            <div style="flex: 1;">
                <h4 style="color: var(--text-primary); margin-bottom: 0.5rem;">${vehicle.name}</h4>
                <p style="color: var(--accent-red); font-weight: 600; margin-bottom: 0.5rem;">${vehicle.price}</p>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">${vehicle.description}</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <button class="btn btn-primary" onclick="editVehicle(${vehicle.id})">تعديل</button>
                <button class="btn btn-secondary" style="background: var(--primary-red);" onclick="deleteVehicle(${vehicle.id})">حذف</button>
            </div>
        </div>
    `).join('');
}

function loadAdminPlayers() {
    const playersList = document.getElementById('admin-players-list');
    if (!playersList) return;
    
    // Generate sample players
    const samplePlayers = [
        { id: 1, name: 'Player1', level: 15, money: '$500,000', status: 'online' },
        { id: 2, name: 'Player2', level: 23, money: '$1,200,000', status: 'online' },
        { id: 3, name: 'Player3', level: 8, money: '$150,000', status: 'offline' }
    ];
    
    playersList.innerHTML = samplePlayers.map(player => `
        <div class="player-item" style="background: var(--card-bg); padding: 1.5rem; border-radius: 1rem; margin-bottom: 1rem; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h4 style="color: var(--text-primary); margin-bottom: 0.5rem;">${player.name}</h4>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">المستوى: ${player.level} • المال: ${player.money}</p>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="padding: 0.25rem 1rem; background: ${player.status === 'online' ? 'var(--success-color)' : 'var(--text-muted)'}; color: white; border-radius: 2rem; font-size: 0.8rem;">
                    ${player.status === 'online' ? 'متصل' : 'غير متصل'}
                </span>
                <button class="btn btn-primary" onclick="managePlayer(${player.id})">إدارة</button>
            </div>
        </div>
    `).join('');
}

function loadAdminSettings() {
    const welcomeMessage = document.getElementById('welcome-message');
    const discordLink = document.getElementById('discord-link');
    
    if (welcomeMessage) welcomeMessage.value = serverSettings.welcomeMessage;
    if (discordLink) discordLink.value = serverSettings.discordLink;
}

// Application Functions
function openApplication(type) {
    if (!currentUser) {
        showNotification('يجب تسجيل الدخول أولاً', 'warning');
        return;
    }
    
    const modal = document.getElementById('application-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('application-form');
    
    if (modal && modalTitle && form) {
        const titles = {
            admin: 'تقديم إدارة',
            activation: 'تفعيل الحساب',
            faction: 'تقديم فصيل'
        };
        
        modalTitle.textContent = titles[type] || 'تقديم';
        form.dataset.type = type;
        modal.classList.add('active');
    }
}

function closeModal() {
    const modal = document.getElementById('application-modal');
    if (modal) {
        modal.classList.remove('active');
        document.getElementById('application-form').reset();
    }
}

// Form submission
document.getElementById('application-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        type: this.dataset.type,
        name: document.getElementById('app-name').value,
        email: document.getElementById('app-email').value,
        age: document.getElementById('app-age').value,
        reason: document.getElementById('app-reason').value,
        experience: document.getElementById('app-experience').value,
        status: 'pending',
        date: new Date().toISOString()
    };
    
    // Add to applications array
    applications.push({
        ...formData,
        id: applications.length + 1
    });
    
    // Save to localStorage
    localStorage.setItem('hairServerApplications', JSON.stringify(applications));
    
    // Show success message
    showNotification('تم إرسال التقديم بنجاح! سيتم الرد قريباً', 'success');
    
    // Close modal
    closeModal();
    
    // If user is admin, refresh admin panel
    if (currentUser && currentUser.isOwner) {
        loadAdminApplications();
    }
});

// Admin Functions
function acceptApplication(id) {
    const application = applications.find(app => app.id === id);
    if (application) {
        application.status = 'accepted';
        showNotification(`تم قبول تقديم ${application.name}`, 'success');
        loadAdminApplications();
    }
}

function rejectApplication(id) {
    const application = applications.find(app => app.id === id);
    if (application) {
        application.status = 'rejected';
        showNotification(`تم رفض تقديم ${application.name}`, 'info');
        loadAdminApplications();
    }
}

function editApplication(id) {
    const application = applications.find(app => app.id === id);
    if (application) {
        const newReason = prompt('عدل رسالة التقديم:', application.reason);
        if (newReason) {
            application.reason = newReason;
            showNotification('تم تعديل التقديم بنجاح', 'success');
            loadAdminApplications();
        }
    }
}

function addVehicle() {
    const name = prompt('اسم السيارة:');
    const price = prompt('السعر:');
    const description = prompt('الوصف:');
    
    if (name && price && description) {
        const newVehicle = {
            id: vehicles.length + 1,
            name,
            price: `$${price}`,
            image: `https://picsum.photos/seed/${name}/400/300`,
            description
        };
        
        vehicles.push(newVehicle);
        loadStoreItems();
        loadAdminVehicles();
        showNotification('تم إضافة السيارة بنجاح', 'success');
    }
}

function editVehicle(id) {
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
        const newPrice = prompt('السعر الجديد:', vehicle.price.replace('$', ''));
        if (newPrice) {
            vehicle.price = `$${newPrice}`;
            loadStoreItems();
            loadAdminVehicles();
            showNotification('تم تعديل سعر السيارة بنجاح', 'success');
        }
    }
}

function deleteVehicle(id) {
    if (confirm('هل أنت متأكد من حذف هذه السيارة؟')) {
        vehicles = vehicles.filter(v => v.id !== id);
        loadStoreItems();
        loadAdminVehicles();
        showNotification('تم حذف السيارة بنجاح', 'success');
    }
}

function managePlayer(id) {
    showNotification(`إدارة اللاعب رقم ${id} - قيد التطوير`, 'info');
}

function saveSettings() {
    const welcomeMessage = document.getElementById('welcome-message').value;
    const discordLink = document.getElementById('discord-link').value;
    
    serverSettings.welcomeMessage = welcomeMessage;
    serverSettings.discordLink = discordLink;
    
    localStorage.setItem('hairServerSettings', JSON.stringify(serverSettings));
    showNotification('تم حفظ الإعدادات بنجاح', 'success');
}

// Purchase Functions
function purchaseVehicle(id) {
    if (!currentUser) {
        showNotification('يجب تسجيل الدخول أولاً', 'warning');
        return;
    }
    
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
        showNotification(`جاري شراء ${vehicle.name}...`, 'info');
        setTimeout(() => {
            showNotification(`تم شراء ${vehicle.name} بنجاح!`, 'success');
        }, 2000);
    }
}

// Utility Functions
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function toggleRule(element) {
    const category = element.parentElement;
    category.classList.toggle('active');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

function loadSavedData() {
    // Load applications
    const savedApplications = localStorage.getItem('hairServerApplications');
    if (savedApplications) {
        applications = JSON.parse(savedApplications);
    }
    
    // Load settings
    const savedSettings = localStorage.getItem('hairServerSettings');
    if (savedSettings) {
        serverSettings = JSON.parse(savedSettings);
    }
}

// Real-time Updates
function startRealTimeUpdates() {
    // Update online players count
    setInterval(updateOnlinePlayers, 30000);
    
    // Check for new applications
    setInterval(checkNewApplications, 60000);
}

function updateOnlinePlayers() {
    const playersElement = document.getElementById('online-players');
    if (playersElement) {
        const currentCount = parseInt(playersElement.textContent);
        const change = Math.floor(Math.random() * 21) - 10; // Random change between -10 and +10
        const newCount = Math.max(50, Math.min(200, currentCount + change));
        playersElement.textContent = newCount;
    }
}

function checkNewApplications() {
    // Simulate checking for new applications
    if (Math.random() > 0.8) {
        showNotification('لديك تقديم جديد!', 'info');
    }
}

// Animations
function initializeAnimations() {
    // Add scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
}

// Modal initialization
function initializeModals() {
    // Close modal when clicking outside
    document.getElementById('application-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            closeAdminPanel();
        }
    });
}

function simulateDiscordLogin() {
    // Simulate Discord authentication
    showNotification('جاري تسجيل الدخول بحساب ديسكورد...', 'info');
    
    setTimeout(() => {
        // Mock user data with better info
        currentUser = {
            id: '1496988349762900029', // Using the real Discord ID
            username: '𝐏𝐞𝐫𝐟𝐞𝐜𝐭 𝐂𝐅𝐖',
            discriminator: '0001',
            avatar: 'https://picsum.photos/seed/perfectcfw/100/100',
            email: 'admin@perfectcfw.com',
            isOwner: true // Set as owner for testing
        };
        
        // Save user data
        localStorage.setItem('hairServerUser', JSON.stringify(currentUser));
        
        // Update UI
        updateUserProfile();
        
        showNotification('تم تسجيل الدخول بنجاح! (وضع تجريبي)', 'success');
    }, 2000);
}

// Logout function
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        // Clear user data
        currentUser = null;
        localStorage.removeItem('hairServerUser');
        localStorage.removeItem('hairServerToken');
        
        // Update UI
        updateUserProfile();
        
        showNotification('تم تسجيل الخروج بنجاح', 'info');
    }
}

// Check for Discord auth code in localStorage (fallback)
function checkDiscordAuth() {
    const authCode = localStorage.getItem('discord_auth_code');
    if (authCode) {
        handleDiscordCallback(authCode);
        localStorage.removeItem('discord_auth_code');
    }
}

// Reviews and Polls Data
let reviews = [];
let polls = [];
let currentRating = 0;

// Initialize rating stars
function initializeRatingStars() {
    const stars = document.querySelectorAll('#rating-stars i');
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            currentRating = index + 1;
            updateRatingStars();
        });
        
        star.addEventListener('mouseenter', () => {
            highlightStars(index + 1);
        });
    });
    
    document.getElementById('rating-stars').addEventListener('mouseleave', () => {
        updateRatingStars();
    });
}

function updateRatingStars() {
    const stars = document.querySelectorAll('#rating-stars i');
    stars.forEach((star, index) => {
        if (index < currentRating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('#rating-stars i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Submit review
function submitReview() {
    if (!currentUser) {
        showNotification('يجب تسجيل الدخول أولاً', 'warning');
        return;
    }
    
    const reviewText = document.getElementById('review-text').value.trim();
    
    if (!reviewText) {
        showNotification('اكتب تقييمك أولاً', 'warning');
        return;
    }
    
    if (currentRating === 0) {
        showNotification('اختر تقييم من 1 إلى 5 نجوم', 'warning');
        return;
    }
    
    const review = {
        id: reviews.length + 1,
        userId: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        rating: currentRating,
        text: reviewText,
        date: new Date().toISOString()
    };
    
    reviews.unshift(review);
    localStorage.setItem('hairServerReviews', JSON.stringify(reviews));
    
    // Reset form
    document.getElementById('review-text').value = '';
    currentRating = 0;
    updateRatingStars();
    
    loadReviews();
    showNotification('تم إرسال التقييم بنجاح!', 'success');
}

// Load reviews
function loadReviews() {
    const savedReviews = localStorage.getItem('hairServerReviews');
    if (savedReviews) {
        reviews = JSON.parse(savedReviews);
    }
    
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;
    
    if (reviews.length === 0) {
        reviewsList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">لا توجد تقييمات حالياً</p>';
        return;
    }
    
    reviewsList.innerHTML = reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <div class="review-author">
                    <img src="${review.avatar}" alt="${review.username}" class="review-avatar">
                    <div class="review-name">${review.username}</div>
                </div>
                <div class="review-rating">
                    ${generateStars(review.rating)}
                </div>
            </div>
            <div class="review-content">${review.text}</div>
            <div class="review-date">${formatDate(review.date)}</div>
        </div>
    `).join('');
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star" style="color: var(--accent-red);"></i>';
        } else {
            stars += '<i class="fas fa-star" style="color: var(--text-muted);"></i>';
        }
    }
    return stars;
}

// Load polls
function loadPolls() {
    const savedPolls = localStorage.getItem('hairServerPolls');
    if (savedPolls) {
        polls = JSON.parse(savedPolls);
    }
    
    // Sample polls if none exist
    if (polls.length === 0) {
        polls = [
            {
                id: 1,
                question: 'ما هو أفضل وقت للعب في السيرفر؟',
                options: ['الصباح', 'المساء', 'الليل', 'فترة بعد الظهر'],
                votes: [45, 30, 15, 10],
                totalVotes: 100,
                isActive: true,
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 2,
                question: 'ما هو نوع السيارة المفضل لديك؟',
                options: ['رياضية', 'كلاسيكية', 'عائلية', 'دراجة نارية'],
                votes: [60, 25, 10, 5],
                totalVotes: 100,
                isActive: false,
                endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }
    
    const pollsContainer = document.getElementById('polls-container');
    if (!pollsContainer) return;
    
    pollsContainer.innerHTML = polls.map(poll => createPollHTML(poll)).join('');
}

function createPollHTML(poll) {
    const isExpired = new Date() > new Date(poll.endDate);
    const statusClass = isExpired ? 'ended' : '';
    const statusText = isExpired ? 'منتهي' : 'نشط';
    
    return `
        <div class="poll-item">
            <div class="poll-header">
                <h3 class="poll-title">${poll.question}</h3>
                <span class="poll-status ${statusClass}">${statusText}</span>
            </div>
            <div class="poll-question">${poll.question}</div>
            <div class="poll-options">
                ${poll.options.map((option, index) => `
                    <div class="poll-option ${!poll.isActive && poll.votes[index] > 0 ? 'selected' : ''}">
                        <input type="radio" id="poll-${poll.id}-${index}" name="poll-${poll.id}" value="${index}" ${!poll.isActive && poll.votes[index] > 0 ? 'checked' : ''} ${poll.isActive ? '' : 'disabled'}>
                        <label for="poll-${poll.id}-${index}">
                            <span>${option}</span>
                            ${!poll.isActive ? `<span class="poll-results"> (${poll.votes[index]} صوت)</span>` : ''}
                        </label>
                    </div>
                `).join('')}
            </div>
            ${!poll.isActive ? `
                <div class="poll-results">
                    ${poll.options.map((option, index) => `
                        <div class="poll-result">
                            <span class="poll-result-text">${option}</span>
                            <div class="poll-result-bar">
                                <div class="poll-result-fill" style="width: ${(poll.votes[index] / poll.totalVotes) * 100}%"></div>
                            </div>
                            <span>${poll.votes[index]} صوت (${((poll.votes[index] / poll.totalVotes) * 100).toFixed(1)}%)</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            <div class="poll-actions">
                ${poll.isActive ? `<button class="btn btn-primary" onclick="votePoll(${poll.id})">تصويت</button>` : ''}
            </div>
        </div>
    `;
}

function votePoll(pollId) {
    if (!currentUser) {
        showNotification('يجب تسجيل الدخول أولاً', 'warning');
        return;
    }
    
    const selectedOption = document.querySelector(`input[name="poll-${pollId}"]:checked`);
    if (!selectedOption) {
        showNotification('اختر خياراً للتصويت', 'warning');
        return;
    }
    
    const poll = polls.find(p => p.id === pollId);
    if (poll) {
        poll.votes[selectedOption.value]++;
        poll.totalVotes++;
        
        localStorage.setItem('hairServerPolls', JSON.stringify(polls));
        loadPolls();
        showNotification('تم التصويت بنجاح!', 'success');
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Export functions for global access
window.HairServer = {
    scrollToSection,
    toggleRule,
    openApplication,
    closeModal,
    openAdminPanel,
    closeAdminPanel,
    switchAdminTab,
    acceptApplication,
    rejectApplication,
    editApplication,
    addVehicle,
    editVehicle,
    deleteVehicle,
    managePlayer,
    saveSettings,
    purchaseVehicle,
    showNotification,
    logout,
    submitReview,
    votePoll,
    initializeRatingStars
};
