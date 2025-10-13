// Initialize AOS (Animate On Scroll) with error handling
try {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100
        });
    } else {
        console.warn('AOS library not loaded, animations will be handled by CSS');
    }
} catch (error) {
    console.warn('AOS initialization failed:', error);
}

// Custom Cursor
class CustomCursor {
    constructor() {
        this.cursor = document.querySelector('.cursor');
        this.cursorFollower = document.querySelector('.cursor-follower');
        this.x = 0;
        this.y = 0;
        this.fx = 0;
        this.fy = 0;
        this.needsUpdate = false;
        this.init();
    }

    init() {
        const update = () => {
            if (this.needsUpdate) {
                // Use left/top to preserve CSS centering translate(-50%, -50%)
                this.cursor.style.left = this.x + 'px';
                this.cursor.style.top = this.y + 'px';
                this.fx += (this.x - this.fx) * 0.2;
                this.fy += (this.y - this.fy) * 0.2;
                this.cursorFollower.style.left = this.fx + 'px';
                this.cursorFollower.style.top = this.fy + 'px';
                this.needsUpdate = false;
            }
            requestAnimationFrame(update);
        };

        document.addEventListener('mousemove', (e) => {
            this.x = e.clientX;
            this.y = e.clientY;
            this.needsUpdate = true;
        }, { passive: true });

        requestAnimationFrame(update);

        // Hover effects
        const hoverElements = document.querySelectorAll('a, button, .project-card, .feedback-item, .contact-item');
        
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.cursor.classList.add('hover');
                this.cursorFollower.classList.add('hover');
            });
            
            el.addEventListener('mouseleave', () => {
                this.cursor.classList.remove('hover');
                this.cursorFollower.classList.remove('hover');
            });
        });
    }
}

// Smooth Scrolling
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        // Smooth scroll for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    const offsetTop = target.offsetTop - 70; // Account for fixed navbar
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}

// Mobile Navigation
class MobileNav {
    constructor() {
        this.hamburger = document.querySelector('.hamburger');
        this.navMenu = document.querySelector('.nav-menu');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.init();
    }

    init() {
        this.hamburger.addEventListener('click', () => {
            this.hamburger.classList.toggle('active');
            this.navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.hamburger.classList.remove('active');
                this.navMenu.classList.remove('active');
            });
        });

        // Close mobile menu when clicking on CV button
        const cvButton = document.querySelector('.btn-cv');
        if (cvButton) {
            cvButton.addEventListener('click', () => {
                this.hamburger.classList.remove('active');
                this.navMenu.classList.remove('active');
            });
        }

        // Close mobile menu when clicking anywhere outside the menu
        document.addEventListener('click', (e) => {
            if (!this.navMenu.contains(e.target) && !this.hamburger.contains(e.target)) {
                this.hamburger.classList.remove('active');
                this.navMenu.classList.remove('active');
            }
        });

        // Close mobile menu when clicking on feedback groups
        document.addEventListener('click', (e) => {
            if (e.target.closest('.feedback-group') || e.target.closest('.group-header')) {
                this.hamburger.classList.remove('active');
                this.navMenu.classList.remove('active');
            }
        });
    }
}

// Feedback System - Fixed Google Sheet Integration
class FeedbackSystem {
    constructor() {
        this.feedbackContainer = document.getElementById('feedbackGroups');
        this.sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSxU9mToUr0ck3WHQ1NAYEqedOWSoVqUDAD88Cw7KV_eFrn5OrB5axnGxH7SiCln0MLxRfUyxlnt6gq/pub?output=csv';
        this.init();
    }

    async init() {
        // Show loading spinner
        this.showLoadingSpinner();
        
        try {
            await this.loadFeedbackFromSheet();
        } catch (error) {
            console.error('Error loading feedback from Google Sheet:', error);
            // Try fallback data after 2 seconds
            setTimeout(() => {
                this.loadFallbackData();
            }, 2000);
        }
    }

    showLoadingSpinner() {
        this.feedbackContainer.innerHTML = `
            <div class="loading-spinner">
                <p>Loading student feedback from Google Sheet...</p>
                <div class="spinner"></div>
            </div>
        `;
    }

    // Simple and reliable CSV parser
    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const rows = [];
        
        for (let line of lines) {
            const row = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const next = line[i + 1];
                
                if (char === '"' && inQuotes && next === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    row.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            row.push(current.trim());
            rows.push(row);
        }
        
        return rows;
    }

    async loadFeedbackFromSheet() {
        try {
            console.log('Fetching data from:', this.sheetURL);
            
            // Add CORS proxy as fallback
            const corsProxy = 'https://api.allorigins.win/raw?url=';
            let response;
            
            try {
                response = await fetch(this.sheetURL, {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'Accept': 'text/csv',
                    }
                });
            } catch (corsError) {
                console.warn('Direct fetch failed, trying CORS proxy:', corsError);
                response = await fetch(corsProxy + encodeURIComponent(this.sheetURL));
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvData = await response.text();
            console.log('CSV data received, length:', csvData.length);
            console.log('First 500 chars:', csvData.substring(0, 500));
            
            const rows = this.parseCSV(csvData).filter(r => r.length > 1);
            console.log('Parsed rows:', rows.length);
            
            if (rows.length === 0) {
                throw new Error('No data rows found in CSV');
            }
            
            const headers = rows.shift().map(h => h.trim().toLowerCase());
            console.log('Headers:', headers);
            
            // Map different possible column names
            const groupCol = headers.find(h => h.includes('group') || h.includes('section'));
            const nameCol = headers.find(h => h.includes('name') || h.includes('student'));
            const feedbackCol = headers.find(h => h.includes('feedback') || h.includes('comment') || h.includes('review'));
            
            if (!groupCol || !nameCol || !feedbackCol) {
                throw new Error(`Required columns not found. Found: ${headers.join(', ')}`);
            }
            
            const data = {};

            // Parse CSV data with proper handling
            rows.forEach((row, index) => {
                if (row.length < 3) {
                    console.log(`Skipping incomplete row ${index}:`, row);
                    return;
                }
                
                const entry = {};
                headers.forEach((h, i) => {
                    entry[h] = row[i] ? row[i].trim().replace(/^"|"$/g, '') : '';
                });
                
                const group = entry[groupCol];
                const name = entry[nameCol];
                const feedback = entry[feedbackCol];
                
                // Only add if we have group, name, and feedback
                if (group && name && feedback) {
                    if (!data[group]) data[group] = [];
                    data[group].push({
                        group: group,
                        name: name,
                        feedback: feedback,
                        image: entry.image || entry.avatar || ''
                    });
                    console.log(`Added to group ${group}:`, name);
                } else {
                    console.log(`Skipping incomplete entry:`, { group, name, feedback });
                }
            });

            console.log('Final parsed data:', data);
            console.log('Groups found:', Object.keys(data));
            Object.keys(data).forEach(group => {
                console.log(`Group ${group} has ${data[group].length} items`);
            });

            // Remove loading spinner
            const loader = this.feedbackContainer.querySelector('.loading-spinner');
            if (loader) loader.remove();

            if (Object.keys(data).length === 0) {
                throw new Error('No valid feedback data found');
            }

            this.renderFeedbackFromData(data);
        } catch (error) {
            console.error('Error in loadFeedbackFromSheet:', error);
            this.renderError();
        }
    }

    renderFeedbackFromData(data) {
        console.log('Rendering feedback data:', data);
        
        // Clear any existing content
        this.feedbackContainer.innerHTML = '';
        
        if (Object.keys(data).length === 0) {
            this.renderError();
            return;
        }
        
        // Build feedback sections
        Object.keys(data).forEach((group, index) => {
            console.log(`Creating group: ${group} with ${data[group].length} items`);
            const groupElement = this.createGroupElement(group, data[group], index === 0);
            this.feedbackContainer.appendChild(groupElement);
        });
    }

    createGroupElement(groupName, feedbacks, isFirst = false) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'feedback-group';
        groupDiv.setAttribute('data-aos', 'fade-up');
        groupDiv.setAttribute('data-aos-delay', '100');

        // Header (English title)
        const groupHeader = document.createElement('div');
        groupHeader.className = 'group-header';
        groupHeader.innerHTML = `
            <span class="group-title">Group ${groupName}</span>
            <span class="arrow">▼</span>
        `;

        const groupContent = document.createElement('div');
        groupContent.className = 'group-content';
        groupContent.style.maxHeight = '60px';
        groupContent.style.overflow = 'hidden';
        groupContent.style.transition = 'max-height 0.4s ease';

        // Create feedback cards
        feedbacks.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'feedback-card';

            // Enhanced Arabic content detection
            const isArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(item.feedback);
            const textClass = isArabic ? 'arabic-text' : 'latin-text';

            // Ensure feedback text is not empty
            const feedbackText = item.feedback && item.feedback.trim() ? item.feedback : 'No feedback provided';
            const studentName = item.name && item.name.trim() ? item.name : 'Anonymous Student';

            card.innerHTML = `
                <div class='feedback-content'>
                    ${item.image ? `<img src="${item.image}" alt="${studentName}" class="avatar" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ''}
                    <p class="name">${studentName}</p>
                    <p class="text ${textClass}">"${feedbackText}"</p>
                </div>
            `;
            groupContent.appendChild(card);
        });

        // Store the original state
        let isExpanded = false;

        // Toggle dropdown function
        const toggleDropdown = () => {
            const arrow = groupHeader.querySelector('.arrow');
            
            if (isExpanded) {
                // Close dropdown
                groupContent.style.maxHeight = '60px';
                groupContent.classList.remove('expanded');
                arrow.style.transform = 'rotate(0deg)';
                isExpanded = false;
                console.log('Closing dropdown for group:', groupName);
            } else {
                // Open dropdown
                groupContent.classList.add('expanded');
                // Set a fixed height with scroll
                groupContent.style.maxHeight = '400px';
                groupContent.style.overflowY = 'auto';
                groupContent.style.overflowX = 'hidden';
                arrow.style.transform = 'rotate(180deg)';
                isExpanded = true;
                console.log('Opening dropdown for group:', groupName);
            }
        };

        // Add click event to header
        groupHeader.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleDropdown();
        });

        // Add click event to arrow
        const arrow = groupHeader.querySelector('.arrow');
        arrow.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleDropdown();
        });

        groupDiv.appendChild(groupHeader);
        groupDiv.appendChild(groupContent);
        
        // Auto-expand first group
        if (isFirst) {
            setTimeout(() => {
                toggleDropdown();
            }, 300);
        }
        
        return groupDiv;
    }

    renderError() {
        console.log('Rendering error state');
        this.feedbackContainer.innerHTML = `
            <div class="feedback-group">
                <div class="group-header">
                    <span class="group-title">Feedback</span>
                </div>
                <div class="group-content" style="max-height: 200px;">
                    <div class="feedback-card">
                        <div class="feedback-content">
                            <p class="text" style="color: #ff6b6b;">Unable to load feedback at this time. Please check your internet connection and try again later.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Fallback data method with all groups
    loadFallbackData() {
        console.log('Loading fallback data');
        const fallbackData = {
            'B2': [
                {
                    name: 'Hossam Mohamed',
                    feedback: 'اكيد طبعا مش انا الىى اقول راىى فى حضرتك. بس هقولو وخلاص 😂 حضرتك',
                    image: ''
                },
                {
                    name: 'Fatima Hassan Mohamed',
                    feedback: 'الشرح ممتاز جدا ومفيش اى تعليق سلبى لا على المدرب ولا المكان',
                    image: ''
                },
                {
                    name: 'Mohamed Raafat Abd-Elrahman Ali',
                    feedback: 'شكرا ليك يا بشمهندس ماريو علي وقتك وعلي الشرح الجميل ده',
                    image: ''
                },
                {
                    name: 'Omnia Mohammed',
                    feedback: 'الشرح كان حلو اوي والمحتوى كمان كويس جدا والانستراكتور بيبسط الشرح جدا مش بنحس أنه صعب اوي ❤️ و بالتوفيق لحضرتك 🤍',
                    image: ''
                }
            ],
            'B4': [
                {
                    name: 'Ahmed Hassan',
                    feedback: 'المدرب ماريو شخص مميز جداً وشرحه واضح ومفهوم، استفدت كتير من الكورس',
                    image: ''
                },
                {
                    name: 'Sara Mohamed',
                    feedback: 'أفضل مدرب قابلته في حياتي، طريقة الشرح بسيطة وممتعة جداً',
                    image: ''
                },
                {
                    name: 'Omar Ali',
                    feedback: 'الكورس كان مفيد جداً والمدرب متاح دائماً للإجابة على الأسئلة',
                    image: ''
                }
            ],
            'B5': [
                {
                    name: 'Mariam Essam',
                    feedback: 'كلمه حلوه : انت بجد راجل مجتهد و ده باين عليك و علي ال Knowledge اللي عندك ❤️',
                    image: ''
                },
                {
                    name: 'Sameh Kamal',
                    feedback: 'شكرا جدا جدا لحضرتك ع المجهود العظيم، انا بجد استفدت جدا من ال training',
                    image: ''
                },
                {
                    name: 'Hammam Mohammed',
                    feedback: 'السلام عليكم ورحمه الله وبركاته كل الشكر والتقدير لحضرتك على مجهودك المميز وتعبك الواضح معنا في الكورس',
                    image: ''
                },
                {
                    name: 'Mariam Gamal',
                    feedback: 'حضرتك حد محترم جدااااا وبجد ده افضل كورس اخدته وافضل انستراكتور عدا عليا',
                    image: ''
                },
                {
                    name: 'Youssef Ramadan',
                    feedback: 'ي بشمهندس انا ببقى فاهمه فى السيشن كويس واول ٣ سيشن كانوا كويسين وفهمت وذكرتهم',
                    image: ''
                }
            ]
        };
        
        // Remove loading spinner
        const loader = this.feedbackContainer.querySelector('.loading-spinner');
        if (loader) loader.remove();
        
        this.renderFeedbackFromData(fallbackData);
    }
}

// Parallax Effects
// Unified Scroll Manager (rAF + passive) for parallax, navbar, back-to-top, progress
const ScrollManager = {
    initialized: false,
    progressBar: null,
    navbar: null,
    backToTopBtn: null,
    parallaxNodes: [],
    ticking: false,
    lastY: 0,
    init() {
        if (this.initialized) return;
        this.initialized = true;
        this.navbar = document.querySelector('.navbar');
        this.backToTopBtn = document.getElementById('backToTop');
        this.parallaxNodes = Array.from(document.querySelectorAll('.floating-shapes .shape'));

        // Create progress bar
        this.progressBar = document.createElement('div');
        this.progressBar.setAttribute('id', 'scrollProgressBar');
        this.progressBar.style.cssText = `position:fixed;top:0;left:0;width:0%;height:3px;background:linear-gradient(90deg,#00bfff,#8a2be2);z-index:10001;transition:width 0.1s ease;box-shadow:0 0 10px rgba(0,191,255,0.5);`;
        document.body.appendChild(this.progressBar);

        const onScroll = () => {
            this.lastY = window.pageYOffset || document.documentElement.scrollTop || 0;
            if (!this.ticking) {
                this.ticking = true;
                requestAnimationFrame(() => {
                    this.handleScroll(this.lastY);
                    this.ticking = false;
                });
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        // Run initially
        this.handleScroll(0);
    },
    handleScroll(scrollY) {
        // Navbar appearance
        if (this.navbar) {
            if (scrollY > 100) {
                this.navbar.style.background = 'rgba(13, 13, 13, 0.98)';
                this.navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.5)';
            } else {
                this.navbar.style.background = 'rgba(13, 13, 13, 0.95)';
                this.navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
            }
        }

        // Back to top visibility
        if (this.backToTopBtn) {
            if (scrollY > 150) this.backToTopBtn.classList.add('visible');
            else this.backToTopBtn.classList.remove('visible');
        }

        // Progress bar width
        if (this.progressBar) {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
            this.progressBar.style.width = pct + '%';
        }

        // Parallax shapes
        if (this.parallaxNodes.length) {
            this.parallaxNodes.forEach((el, index) => {
                const speed = 0.05 + (index * 0.02);
                el.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`;
            });
        }
    }
};

// Typing Animation for Hero Title
class TypingAnimation {
    constructor() {
        this.titleElement = document.querySelector('.hero-title');
        this.init();
    }

    init() {
        if (this.titleElement) {
            this.animateTitle();
        }
    }

    animateTitle() {
        const titleLines = this.titleElement.querySelectorAll('.title-line');
        titleLines.forEach((line, index) => {
            line.style.opacity = '0';
            line.style.transform = 'translateY(50px)';
            
            setTimeout(() => {
                line.style.transition = 'all 1s ease-out';
                line.style.opacity = '1';
                line.style.transform = 'translateY(0)';
            }, index * 500);
        });
    }
}


// Enhanced Scroll Animations with IntersectionObserver
class ScrollAnimations {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        this.init();
    }

    init() {
        // Create intersection observer
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add visible class to trigger animation
                    entry.target.classList.add('visible');
                    
                    // Add neon pulse effect for elements with neon-pulse class
                    if (entry.target.classList.contains('neon-pulse')) {
                        entry.target.classList.add('neon-pulse-visible');
                    }
                    
                    // Stop observing this element once it's animated
                    this.observer.unobserve(entry.target);
                }
            });
        }, this.observerOptions);

        // Observe all elements with animation classes
        this.observeElements();
    }

    observeElements() {
        const animationSelectors = [
            '.fade-up', '.fade-down', '.fade-left', '.fade-right', 
            '.zoom-in', '.slide-up', '.scroll-animate'
        ];
        
        animationSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Only observe if not already visible to avoid re-triggering
                if (!el.classList.contains('visible')) {
                    this.observer.observe(el);
                }
            });
        });

        // Also observe dynamic content
        this.observeDynamicContent();
    }

    observeDynamicContent() {
        // Observe blog cards when they're loaded
        const blogContainer = document.getElementById('blogContainer');
        if (blogContainer) {
            const blogObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            const blogCards = node.querySelectorAll ? node.querySelectorAll('.blog-card') : [];
                            blogCards.forEach(card => {
                                this.observer.observe(card);
                            });
                        }
                    });
                });
            });
            blogObserver.observe(blogContainer, { childList: true, subtree: true });
        }

        // Observe feedback groups when they're loaded
        const feedbackContainer = document.getElementById('feedbackGroups');
        if (feedbackContainer) {
            const feedbackObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            if (node.classList && node.classList.contains('feedback-group')) {
                                this.observer.observe(node);
                            }
                        }
                    });
                });
            });
            feedbackObserver.observe(feedbackContainer, { childList: true, subtree: true });
        }
    }
}

// Back to Top Button
class BackToTop {
    constructor() {
        this.button = document.getElementById('backToTop');
        this.scrollThreshold = 150;
        this.init();
    }

    init() {
        if (!this.button) return;

        // Visibility handled by ScrollManager

        // Smooth scroll to top when clicked
        this.button.addEventListener('click', (e) => {
            e.preventDefault();
            this.scrollToTop();
        });

        // Keyboard accessibility
        this.button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.scrollToTop();
            }
        });
    }

    toggleVisibility() {
        if (window.pageYOffset > this.scrollThreshold) {
            this.button.classList.add('visible');
        } else {
            this.button.classList.remove('visible');
        }
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Enhanced Loading Screen
class LoadingScreen {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.progress = 0;
        this.init();
    }

    init() {
        this.startProgress();
        this.hideLoading();
    }

    startProgress() {
        const messages = [
            'Initializing Portfolio...',
            'Loading Assets...',
            'Setting up Animations...',
            'Preparing Content...',
            'Almost Ready...'
        ];

        let messageIndex = 0;
        const progressInterval = setInterval(() => {
            this.progress += Math.random() * 15;
            
            if (this.progress > 100) {
                this.progress = 100;
                clearInterval(progressInterval);
            }

            this.updateProgress();
            
            // Update message
            if (this.progress > 20 && messageIndex < 1) {
                messageIndex = 1;
                this.updateMessage(messages[messageIndex]);
            } else if (this.progress > 40 && messageIndex < 2) {
                messageIndex = 2;
                this.updateMessage(messages[messageIndex]);
            } else if (this.progress > 60 && messageIndex < 3) {
                messageIndex = 3;
                this.updateMessage(messages[messageIndex]);
            } else if (this.progress > 80 && messageIndex < 4) {
                messageIndex = 4;
                this.updateMessage(messages[messageIndex]);
            }
        }, 100);
    }

    updateProgress() {
        if (this.progressFill && this.progressText) {
            this.progressFill.style.width = this.progress + '%';
            this.progressText.textContent = Math.round(this.progress) + '%';
        }
    }

    updateMessage(message) {
        if (this.loadingMessage) {
            this.loadingMessage.textContent = message;
        }
    }

    hideLoading() {
        // Hide loading screen when progress reaches 100% and DOM is ready
        const checkComplete = () => {
            if (this.progress >= 100 && document.readyState === 'complete') {
            setTimeout(() => {
                if (this.loadingScreen) {
                    this.loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        this.loadingScreen.style.display = 'none';
                        }, 800);
                    }
                    }, 500);
            } else {
                setTimeout(checkComplete, 100);
            }
        };

        checkComplete();

        // Fallback: hide after 4 seconds regardless
        setTimeout(() => {
            if (this.loadingScreen && this.loadingScreen.style.display !== 'none') {
                this.progress = 100;
                this.updateProgress();
                this.updateMessage('Ready!');
                setTimeout(() => {
                this.loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    this.loadingScreen.style.display = 'none';
                    }, 500);
                }, 500);
            }
        }, 4000);
    }
}

// Blog System - LinkedIn Posts
class BlogSystem {
    constructor() {
        this.blogContainer = document.getElementById('blogContainer');
        this.init();
    }

    init() {
        this.loadBlogPosts();
    }

    async loadBlogPosts() {
        try {
            // Show loading state
            this.showLoading();
            
            // Try to fetch real LinkedIn posts
            const posts = await this.fetchLinkedInPosts();
            
            if (posts && posts.length > 0) {
                this.renderBlogPosts(posts);
            } else {
                throw new Error('No posts found');
            }
        } catch (error) {
            console.error('Error loading blog posts:', error);
            // Fallback to static posts if API fails
            this.renderBlogPosts();
        }
    }

    showLoading() {
        this.blogContainer.innerHTML = `
            <div class="blog-loading">
                <div class="loading-spinner"></div>
                <p>Loading latest posts from LinkedIn...</p>
            </div>
        `;
    }

    async fetchLinkedInPosts() {
        try {
            // Method 1: Try LinkedIn RSS feed (if available)
            const rssUrl = 'https://www.linkedin.com/feed/rss/urn:li:activity:YOUR_ACTIVITY_ID';
            
            // Method 2: Use a web scraping service
            const proxyUrl = 'https://api.allorigins.win/raw?url=';
            const linkedinUrl = 'https://www.linkedin.com/in/mario-ibrahem/';
            
            const response = await fetch(proxyUrl + encodeURIComponent(linkedinUrl));
            
            if (!response.ok) {
                throw new Error('Failed to fetch LinkedIn posts');
            }
            
            const html = await response.text();
            return this.parseLinkedInPosts(html);
            
        } catch (error) {
            console.warn('LinkedIn API not available, using static posts');
            throw error;
        }
    }

    parseLinkedInPosts(html) {
        try {
            // Create a temporary DOM parser
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Look for LinkedIn post elements
            const postElements = doc.querySelectorAll('[data-activity-id], .feed-shared-update-v2');
            
            if (postElements.length === 0) {
                throw new Error('No posts found');
            }
            
            const posts = Array.from(postElements).slice(0, 2).map((element, index) => {
                // Try different selectors for title
                const title = element.querySelector('h3, .feed-shared-text, .feed-shared-text__text-view')?.textContent?.trim() || 
                             element.querySelector('.feed-shared-text')?.textContent?.trim() || 
                             'LinkedIn Post';
                
                // Try different selectors for content
                const content = element.querySelector('.feed-shared-text, .feed-shared-text__text-view')?.textContent?.trim() || 
                               element.querySelector('.feed-shared-text')?.textContent?.trim() || 
                               '';
                
                // Try different selectors for date
                const date = element.querySelector('time, .feed-shared-actor__sub-description time')?.textContent?.trim() || 
                            element.querySelector('.feed-shared-actor__sub-description')?.textContent?.trim() || 
                            'Recently';
                
                // Try different selectors for link
                const link = element.querySelector('a[href*="linkedin.com"]')?.href || 
                            'https://www.linkedin.com/in/mario-ibrahem';
                
                return {
                    title: title.length > 100 ? title.substring(0, 100) + '...' : title,
                    excerpt: content.length > 200 ? content.substring(0, 200) + '...' : content,
                    date: date,
                    link: link,
                    tags: ['LinkedIn', 'Post', 'Update'],
                    stats: { views: '100+', likes: '50+', comments: '10+' }
                };
            });
            
            return posts;
            
        } catch (error) {
            console.warn('Error parsing LinkedIn posts:', error);
            throw error;
        }
    }

    renderBlogPosts(posts = null) {
        if (!posts) {
            // Static posts with correct dates and links
            posts = [
            {
                title: "🚀 Intro to Networking & Cybersecurity Training – NTI Fayoum (Round 2) 🚀",
                excerpt: "بعد النجاح الكبير اللي حققناه في أول راوند من التدريب، رجعنا من جديد في Round 2 🎯 لكن المرة دي كانت مختلفة تمامًا — مش بمجموعة واحدة، لكن جروبين كاملين من الطلبة المتحمسين اللي جم بعزيمة حقيقية إنهم يبدأوا طريقهم في عالم ال Cybersecurity 💪🔥",
                date: "12/10/2025",
                link: "https://www.linkedin.com/feed/update/urn:li:activity:7383187585981964290/",
                tags: ["Networking", "Cybersecurity", "Training", "NTI"],
                stats: { views: "500+", likes: "106", comments: "43" }
            },
            {
                title: "🚀 Intro to Networking & Cybersecurity Training – NTI Fayoum 🚀",
                excerpt: "في أول يوم من التدريب، طالب سألني: 'هو إزاي الواحد ممكن يبدأ في الـ Cybersecurity من غير ما يحس إن الطريق معقد؟' 🤔 السؤال ده كان spark البداية… ومن هنا بدأنا نكتشف إن أي خطوة صغيرة ممكن تفتح أبواب كبيرة، ومع كل تمرين عملي، كنت بشوف الشغف بيزيد، والفضول بيتحول لخبرة حقيقية 🔥",
                date: "30/8/2025",
                link: "https://www.linkedin.com/feed/update/urn:li:activity:7373793225842647040/",
                tags: ["Networking", "Cybersecurity", "Training", "Students"],
                stats: { views: "800+", likes: "211", comments: "46" }
            },
            {
                title: "🔒 Thrilled to wrap up my role as an Instructor in 3 full rounds of the Cybersecurity Academy for Youth & Juniors",
                excerpt: "Thrilled to wrap up my role as an Instructor in 3 full rounds of the Cybersecurity Academy for Youth & Juniors — proudly held at the Digital Egypt Innovation Center. It was an incredible journey teaching cybersecurity fundamentals to young minds and seeing their passion for learning grow with each session.",
                date: "28/7/2025",
                link: "https://www.linkedin.com/feed/update/urn:li:activity:7357832554768429056/",
                tags: ["Cybersecurity", "Academy", "Youth", "Innovation"],
                stats: { views: "600+", likes: "203", comments: "90" }
            }
            ];
        }

        this.blogContainer.innerHTML = posts.map((post, index) => `
            <div class="blog-card" data-aos="fade-up" data-aos-delay="${(index + 1) * 100}">
                <div class="blog-header">
                    <div class="blog-meta">
                        <span class="blog-date">
                            <i class="fas fa-calendar"></i>
                            ${post.date}
                        </span>
                        <span class="blog-platform">
                            <i class="fab fa-linkedin"></i>
                            LinkedIn
                        </span>
                    </div>
                    <div class="blog-actions">
                        <a href="${post.link}" target="_blank" class="blog-link">
                            <i class="fas fa-external-link-alt"></i>
                            View Post
                        </a>
                    </div>
                </div>
                <div class="blog-content">
                    <h3 class="blog-title">${post.title}</h3>
                    <p class="blog-excerpt">${post.excerpt}</p>
                    <div class="blog-tags">
                        ${post.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="blog-footer">
                    <div class="blog-stats">
                        <span class="blog-stat">
                            <i class="fas fa-eye"></i>
                            ${post.stats.views} views
                        </span>
                        <span class="blog-stat">
                            <i class="fas fa-heart"></i>
                            ${post.stats.likes} likes
                        </span>
                        <span class="blog-stat">
                            <i class="fas fa-comment"></i>
                            ${post.stats.comments} comments
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderError() {
        this.blogContainer.innerHTML = `
            <div class="blog-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Unable to load posts</h3>
                <p>There was an error loading the latest posts from LinkedIn. Please try again later.</p>
                <a href="https://www.linkedin.com/in/mario-ibrahem" target="_blank" class="btn btn-primary">
                    <i class="fab fa-linkedin"></i>
                    Visit LinkedIn Profile
                </a>
            </div>
        `;
    }
}

// Theme Toggle

// Profile Photo Fallback
class ProfilePhotoFallback {
    constructor() {
        this.init();
    }

    init() {
        const profilePhoto = document.querySelector('.profile-photo');
        const aboutProfilePhoto = document.querySelector('.about-profile-photo');
        
        // Handle hero section profile photo
        if (profilePhoto) {
            this.setupImageFallback(profilePhoto);
        }
        
        // Handle about section profile photo
        if (aboutProfilePhoto) {
            this.setupImageFallback(aboutProfilePhoto);
        }
    }
    
    setupImageFallback(imageElement) {
        // Check if image loads successfully
        imageElement.addEventListener('error', () => {
            // If image fails to load, show the gradient with icon
            imageElement.classList.add('fallback');
        });

        // Check if image loads successfully
        imageElement.addEventListener('load', () => {
            // If image loads, remove the fallback class
            imageElement.classList.remove('fallback');
        });

        // Wait a bit for image to load, then check
        setTimeout(() => {
            if (!imageElement.complete || imageElement.naturalHeight === 0) {
                // Image not loaded yet, show gradient
                imageElement.classList.add('fallback');
            }
        }, 2000);
    }
}

// Initialize all components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new LoadingScreen();
        new CustomCursor();
        new SmoothScroll();
        new MobileNav();
        new FeedbackSystem();
        ScrollManager.init();
        new TypingAnimation();
        new ScrollAnimations();
        new BlogSystem();
        new ProfilePhotoFallback();
    } catch (error) {
        console.error('Error initializing components:', error);
        // Hide loading screen even if there's an error
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }
});

// Add some additional interactive effects
document.addEventListener('DOMContentLoaded', () => {
    // Add hover effects to project cards
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add click ripple effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Add typing effect to hero subtitle
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) {
        const text = heroSubtitle.textContent;
        heroSubtitle.textContent = '';
        let i = 0;
        
        const typeWriter = () => {
            if (i < text.length) {
                heroSubtitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        };
        
        setTimeout(typeWriter, 2000);
    }

    // Add particle effect to hero section
    createParticles();

    // Add contact card interactions
    addContactCardEffects();
});

// Particle Effect
function createParticles() {
    const hero = document.querySelector('.hero');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            pointer-events: none;
            animation: particleFloat ${3 + Math.random() * 4}s linear infinite;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 2}s;
        `;
        hero.appendChild(particle);
    }
}

// Scroll Progress Indicator
function addScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #00bfff, #8a2be2);
        z-index: 10001;
        transition: width 0.1s ease;
        box-shadow: 0 0 10px rgba(0, 191, 255, 0.5);
    `;
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });
}

// Contact Card Effects
function addContactCardEffects() {
    const contactCards = document.querySelectorAll('.contact-card');
    
    contactCards.forEach(card => {
        // Add ripple effect on click
        card.addEventListener('click', (e) => {
            const ripple = document.createElement('span');
            const rect = card.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(0, 191, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
                z-index: 1;
            `;
            
            card.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });

        // Add mouse enter/leave effects
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    .btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes iconPulse {
        0%, 100% {
            transform: scale(1);
            filter: brightness(1);
        }
        50% {
            transform: scale(1.05);
            filter: brightness(1.2);
        }
    }
    
    .animate-in {
        animation: fadeInUp 0.8s ease-out forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
