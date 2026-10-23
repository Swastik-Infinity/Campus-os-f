/**
 * CampusOS v1.2 — Automated Frontend Backend-Integration Script
 * Updates campusos-v1.2.html, index.html, public/index.html, public/campusos-v1.2.html
 */
const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '..', 'campusos-v1.2.html');
let content = fs.readFileSync(srcFile, 'utf8');

// 1. Update footer caption on login screen
content = content.replace(
  '<span><strong>Hackathon Prototype</strong> · Data persists locally in browser localStorage</span>',
  '<span><strong>CampusOS v1.2</strong> · Persistent Database Backend (Node.js / Express / PostgreSQL API)</span>'
);

// 2. Fix CF-1003 initial affectedBy count discrepancy
content = content.replace(
  "affectedCount: 3, affectedBy: ['student-aarav']",
  "affectedCount: 3, affectedBy: ['student-aarav', 'student-sana', 'student-rohan']"
);

// 3. Inject backendBridge before STORAGE_KEYS
const bridgeCode = `    // ==========================================
    // BACKEND REST API BRIDGE & SYNCHRONIZATION
    // ==========================================
    const backendBridge = {
      baseUrl: '/api/v1',
      token: null,

      getToken: () => {
        if (backendBridge.token) return backendBridge.token;
        try {
          return sessionStorage.getItem('campusos.token') || localStorage.getItem('campusos.token');
        } catch (e) {
          return null;
        }
      },

      setToken: (token) => {
        backendBridge.token = token;
        try {
          if (token) {
            sessionStorage.setItem('campusos.token', token);
            localStorage.setItem('campusos.token', token);
          } else {
            sessionStorage.removeItem('campusos.token');
            localStorage.removeItem('campusos.token');
          }
        } catch (e) {}
      },

      request: async (endpoint, options = {}) => {
        const url = \`\${backendBridge.baseUrl}\${endpoint}\`;
        const headers = {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        };
        const token = backendBridge.getToken();
        if (token) {
          headers['Authorization'] = \`Bearer \${token}\`;
        }

        try {
          const res = await fetch(url, {
            credentials: 'include',
            ...options,
            headers
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || \`HTTP \${res.status}\`);
          }
          return await res.json();
        } catch (err) {
          console.warn(\`[Backend API] \${options.method || 'GET'} \${endpoint} failed:\`, err.message);
          throw err;
        }
      }
    };

    const STORAGE_KEYS = {`;

content = content.replace('    const STORAGE_KEYS = {', bridgeCode);

// 4. Upgrade ticketRepository to dispatch API calls
const origTicketRepo = `    const ticketRepository = {
      getAll: () => {
        try { const s = localStorage.getItem(STORAGE_KEYS.tickets); if (s) return JSON.parse(s); } catch (e) { }
        localStorage.setItem(STORAGE_KEYS.tickets, JSON.stringify(INITIAL_TICKETS));
        return [...INITIAL_TICKETS];
      },
      saveAll: (list) => {
        localStorage.setItem(STORAGE_KEYS.tickets, JSON.stringify(list));
        AppState.tickets = list;
      },
      create: (t) => {
        const list = ticketRepository.getAll();
        list.unshift(t);
        ticketRepository.saveAll(list);
        return t;
      },
      update: (id, updates) => {
        const list = ticketRepository.getAll();
        const idx = list.findIndex(x => x.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates };
          ticketRepository.saveAll(list);
          return list[idx];
        }
        return null;
      }
    };`;

const newTicketRepo = `    const ticketRepository = {
      getAll: () => {
        try { const s = localStorage.getItem(STORAGE_KEYS.tickets); if (s) return JSON.parse(s); } catch (e) { }
        localStorage.setItem(STORAGE_KEYS.tickets, JSON.stringify(INITIAL_TICKETS));
        return [...INITIAL_TICKETS];
      },
      saveAll: (list) => {
        localStorage.setItem(STORAGE_KEYS.tickets, JSON.stringify(list));
        AppState.tickets = list;
      },
      create: (t) => {
        const list = ticketRepository.getAll();
        list.unshift(t);
        ticketRepository.saveAll(list);

        // Async sync to backend
        backendBridge.request('/tickets', {
          method: 'POST',
          body: JSON.stringify({
            title: t.title,
            category: t.category,
            location: t.location,
            urgency: t.urgency,
            desc: t.desc || ''
          })
        }).then(res => {
          if (res && res.ticket && res.ticket.id) {
            t.id = res.ticket.id;
            ticketRepository.saveAll(AppState.tickets);
          }
        }).catch(() => {});

        return t;
      },
      update: (id, updates) => {
        const list = ticketRepository.getAll();
        const idx = list.findIndex(x => x.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates };
          ticketRepository.saveAll(list);

          if (updates.status) {
            backendBridge.request(\`/tickets/\${id}/status\`, {
              method: 'PATCH',
              body: JSON.stringify({ status: updates.status })
            }).catch(() => {});
          }
          if (updates.assignedTo !== undefined) {
            backendBridge.request(\`/tickets/\${id}/assign\`, {
              method: 'PATCH',
              body: JSON.stringify({ staffId: updates.assignedTo })
            }).catch(() => {});
          }

          return list[idx];
        }
        return null;
      }
    };`;

content = content.replace(origTicketRepo, newTicketRepo);

// 5. Upgrade leaveRepository
const origLeaveRepo = `    const leaveRepository = {
      getAll: () => {
        try { const s = localStorage.getItem(STORAGE_KEYS.leaves); if (s) return JSON.parse(s); } catch (e) { }
        localStorage.setItem(STORAGE_KEYS.leaves, JSON.stringify(INITIAL_LEAVES));
        return [...INITIAL_LEAVES];
      },
      saveAll: (list) => {
        localStorage.setItem(STORAGE_KEYS.leaves, JSON.stringify(list));
        AppState.leaves = list;
      },
      create: (item) => {
        const list = leaveRepository.getAll();
        list.unshift(item);
        leaveRepository.saveAll(list);
        return item;
      },
      updateStatus: (id, status, notes = '') => {
        const list = leaveRepository.getAll();
        const item = list.find(x => x.id === id);
        if (item) {
          item.status = status;
          if (notes) item.notes = notes;
          leaveRepository.saveAll(list);
          return item;
        }
        return null;
      }
    };`;

const newLeaveRepo = `    const leaveRepository = {
      getAll: () => {
        try { const s = localStorage.getItem(STORAGE_KEYS.leaves); if (s) return JSON.parse(s); } catch (e) { }
        localStorage.setItem(STORAGE_KEYS.leaves, JSON.stringify(INITIAL_LEAVES));
        return [...INITIAL_LEAVES];
      },
      saveAll: (list) => {
        localStorage.setItem(STORAGE_KEYS.leaves, JSON.stringify(list));
        AppState.leaves = list;
      },
      create: (item) => {
        const list = leaveRepository.getAll();
        list.unshift(item);
        leaveRepository.saveAll(list);

        backendBridge.request('/leaves', {
          method: 'POST',
          body: JSON.stringify({
            start: item.start,
            end: item.end,
            reason: item.reason,
            document: item.document || ''
          })
        }).then(res => {
          if (res && res.leave && res.leave.id) {
            item.id = res.leave.id;
            leaveRepository.saveAll(AppState.leaves);
          }
        }).catch(() => {});

        return item;
      },
      updateStatus: (id, status, notes = '') => {
        const list = leaveRepository.getAll();
        const item = list.find(x => x.id === id);
        if (item) {
          item.status = status;
          if (notes) item.notes = notes;
          leaveRepository.saveAll(list);

          backendBridge.request(\`/leaves/\${id}/status\`, {
            method: 'PATCH',
            body: JSON.stringify({ status, notes: item.notes })
          }).catch(() => {});

          return item;
        }
        return null;
      }
    };`;

content = content.replace(origLeaveRepo, newLeaveRepo);

// 6. Upgrade noticeRepository
const origNoticeRepo = `    const noticeRepository = {
      getAll: () => {
        try { const s = localStorage.getItem(STORAGE_KEYS.notices); if (s) return JSON.parse(s); } catch (e) { }
        localStorage.setItem(STORAGE_KEYS.notices, JSON.stringify(INITIAL_NOTICES));
        return [...INITIAL_NOTICES];
      },
      saveAll: (list) => {
        localStorage.setItem(STORAGE_KEYS.notices, JSON.stringify(list));
        AppState.notices = list;
      },
      create: (item) => {
        const list = noticeRepository.getAll();
        list.unshift(item);
        noticeRepository.saveAll(list);
        return item;
      },
      markRead: (id, userId) => {
        const list = noticeRepository.getAll();
        const item = list.find(x => x.id === id);
        if (item) {
          item.readBy = item.readBy || [];
          if (!item.readBy.includes(userId)) {
            item.readBy.push(userId);
            noticeRepository.saveAll(list);
          }
        }
      }
    };`;

const newNoticeRepo = `    const noticeRepository = {
      getAll: () => {
        try { const s = localStorage.getItem(STORAGE_KEYS.notices); if (s) return JSON.parse(s); } catch (e) { }
        localStorage.setItem(STORAGE_KEYS.notices, JSON.stringify(INITIAL_NOTICES));
        return [...INITIAL_NOTICES];
      },
      saveAll: (list) => {
        localStorage.setItem(STORAGE_KEYS.notices, JSON.stringify(list));
        AppState.notices = list;
      },
      create: (item) => {
        const list = noticeRepository.getAll();
        list.unshift(item);
        noticeRepository.saveAll(list);

        backendBridge.request('/notices', {
          method: 'POST',
          body: JSON.stringify({
            title: item.title,
            content: item.content,
            audience: item.audience,
            priority: item.priority || 'Normal',
            expiry: item.expiry
          })
        }).then(res => {
          if (res && res.notice && res.notice.id) {
            item.id = res.notice.id;
            noticeRepository.saveAll(AppState.notices);
          }
        }).catch(() => {});

        return item;
      },
      markRead: (id, userId) => {
        const list = noticeRepository.getAll();
        const item = list.find(x => x.id === id);
        if (item) {
          item.readBy = item.readBy || [];
          if (!item.readBy.includes(userId)) {
            item.readBy.push(userId);
            noticeRepository.saveAll(list);
          }
          backendBridge.request(\`/notices/\${id}/toggle-read\`, { method: 'POST' }).catch(() => {});
        }
      }
    };`;

content = content.replace(origNoticeRepo, newNoticeRepo);

// 7. Upgrade serviceRepository
const origServiceRepo = `    const serviceRepository = {
      getAll: () => {
        try { const s = localStorage.getItem(STORAGE_KEYS.services); if (s) return JSON.parse(s); } catch (e) { }
        localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(INITIAL_SERVICES));
        return [...INITIAL_SERVICES];
      },
      saveAll: (list) => {
        localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(list));
        AppState.services = list;
      },
      create: (item) => {
        const list = serviceRepository.getAll();
        list.unshift(item);
        serviceRepository.saveAll(list);
        return item;
      },
      updateStatus: (id, status) => {
        const list = serviceRepository.getAll();
        const item = list.find(x => x.id === id);
        if (item) {
          item.status = status;
          serviceRepository.saveAll(list);
          return item;
        }
        return null;
      }
    };`;

const newServiceRepo = `    const serviceRepository = {
      getAll: () => {
        try { const s = localStorage.getItem(STORAGE_KEYS.services); if (s) return JSON.parse(s); } catch (e) { }
        localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(INITIAL_SERVICES));
        return [...INITIAL_SERVICES];
      },
      saveAll: (list) => {
        localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(list));
        AppState.services = list;
      },
      create: (item) => {
        const list = serviceRepository.getAll();
        list.unshift(item);
        serviceRepository.saveAll(list);

        backendBridge.request('/services', {
          method: 'POST',
          body: JSON.stringify({
            type: item.type,
            details: item.details
          })
        }).then(res => {
          if (res && res.service && res.service.id) {
            item.id = res.service.id;
            serviceRepository.saveAll(AppState.services);
          }
        }).catch(() => {});

        return item;
      },
      updateStatus: (id, status) => {
        const list = serviceRepository.getAll();
        const item = list.find(x => x.id === id);
        if (item) {
          item.status = status;
          serviceRepository.saveAll(list);
          backendBridge.request(\`/services/\${id}/status\`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
          }).catch(() => {});
          return item;
        }
        return null;
      }
    };`;

content = content.replace(origServiceRepo, newServiceRepo);

// 8. Upgrade inventoryRepository
const origInventoryRepo = `    const inventoryRepository = {
      getAll: () => {
        try { const s = localStorage.getItem(STORAGE_KEYS.inventory); if (s) return JSON.parse(s); } catch (e) { }
        localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(INITIAL_INVENTORY));
        return [...INITIAL_INVENTORY];
      },
      saveAll: (list) => {
        localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(list));
        AppState.inventory = list;
      },
      adjustStock: (id, delta) => {
        const list = inventoryRepository.getAll();
        const item = list.find(x => x.id === id);
        if (item) {
          item.stock = Math.max(0, item.stock + delta);
          inventoryRepository.saveAll(list);
          return item;
        }
        return null;
      }
    };`;

const newInventoryRepo = `    const inventoryRepository = {
      getAll: () => {
        try { const s = localStorage.getItem(STORAGE_KEYS.inventory); if (s) return JSON.parse(s); } catch (e) { }
        localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(INITIAL_INVENTORY));
        return [...INITIAL_INVENTORY];
      },
      saveAll: (list) => {
        localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(list));
        AppState.inventory = list;
      },
      adjustStock: (id, delta) => {
        const list = inventoryRepository.getAll();
        const item = list.find(x => x.id === id);
        if (item) {
          item.stock = Math.max(0, item.stock + delta);
          inventoryRepository.saveAll(list);
          backendBridge.request(\`/inventory/\${id}/adjust\`, {
            method: 'PATCH',
            body: JSON.stringify({ delta })
          }).catch(() => {});
          return item;
        }
        return null;
      }
    };`;

content = content.replace(origInventoryRepo, newInventoryRepo);

// 9. Upgrade notificationRepository markAllRead
content = content.replace(
  `      markAllRead: () => {
        const list = notificationRepository.getAll().map(n => ({ ...n, unread: false }));
        notificationRepository.saveAll(list);
      }`,
  `      markAllRead: () => {
        const list = notificationRepository.getAll().map(n => ({ ...n, unread: false }));
        notificationRepository.saveAll(list);
        backendBridge.request('/notifications/mark-all-read', { method: 'POST' }).catch(() => {});
      }`
);

// 10. Upgrade appAuth login & logout
const origAppAuth = `    const appAuth = {
      login: (accountId) => {
        const acc = DEMO_ACCOUNTS.find(a => a.id === accountId);
        if (!acc) return;
        AppState.currentUser = acc;
        localStorage.setItem(STORAGE_KEYS.session, acc.id);

        // Switch screens
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-root').style.display = 'flex';

        // Update header & sidebar user profile
        document.getElementById('sidebar-name').textContent = acc.name;
        document.getElementById('sidebar-role').textContent = acc.label;
        document.getElementById('sidebar-avatar').textContent = acc.avatar;
        document.getElementById('header-avatar').textContent = acc.avatar;
        document.getElementById('header-user-name').textContent = acc.name;
        document.getElementById('header-role-badge').textContent = acc.role.toUpperCase();
        document.getElementById('menu-user-name').textContent = acc.name;
        document.getElementById('menu-user-label').textContent = acc.label;
        document.getElementById('admin-reset-btn-wrap').style.display = acc.role === 'admin' ? 'block' : 'none';

        // Show date
        document.getElementById('topbar-date').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

        // Load initial data
        appStateLoader.loadAll();

        // Render navigation for role
        appNav.renderNavigation();

        // Route to default module
        appNav.switchModule('dashboard');
        appUI.showToast(\`Welcome back, \${acc.name.split(' ')[0]}\`, \`Active role: \${acc.role.toUpperCase()}\`, 'info');
      },
      logout: () => {
        AppState.currentUser = null;
        localStorage.removeItem(STORAGE_KEYS.session);
        document.getElementById('app-root').style.display = 'none';
        document.getElementById('auth-screen').style.display = 'flex';
      },`;

const newAppAuth = `    const appAuth = {
      login: (accountId) => {
        const acc = DEMO_ACCOUNTS.find(a => a.id === accountId);
        if (!acc) return;
        AppState.currentUser = acc;
        localStorage.setItem(STORAGE_KEYS.session, acc.id);

        // Switch screens
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-root').style.display = 'flex';

        // Update header & sidebar user profile
        document.getElementById('sidebar-name').textContent = acc.name;
        document.getElementById('sidebar-role').textContent = acc.label;
        document.getElementById('sidebar-avatar').textContent = acc.avatar;
        document.getElementById('header-avatar').textContent = acc.avatar;
        document.getElementById('header-user-name').textContent = acc.name;
        document.getElementById('header-role-badge').textContent = acc.role.toUpperCase();
        document.getElementById('menu-user-name').textContent = acc.name;
        document.getElementById('menu-user-label').textContent = acc.label;
        document.getElementById('admin-reset-btn-wrap').style.display = acc.role === 'admin' ? 'block' : 'none';

        // Show date
        document.getElementById('topbar-date').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

        // Load initial local data synchronously for immediate render
        appStateLoader.loadAll();

        // Render navigation for role
        appNav.renderNavigation();

        // Route to default module
        appNav.switchModule('dashboard');
        appUI.showToast(\`Welcome back, \${acc.name.split(' ')[0]}\`, \`Active role: \${acc.role.toUpperCase()}\`, 'info');

        // Authenticate with backend and sync persistent database state
        backendBridge.request('/auth/demo-login', {
          method: 'POST',
          body: JSON.stringify({ accountId: acc.id })
        }).then(authData => {
          if (authData && authData.token) {
            backendBridge.setToken(authData.token);
            appStateLoader.syncFromBackend();
          }
        }).catch(() => {});
      },
      logout: () => {
        backendBridge.request('/auth/logout', { method: 'POST' }).catch(() => {});
        backendBridge.setToken(null);
        AppState.currentUser = null;
        localStorage.removeItem(STORAGE_KEYS.session);
        document.getElementById('app-root').style.display = 'none';
        document.getElementById('auth-screen').style.display = 'flex';
      },`;

content = content.replace(origAppAuth, newAppAuth);

// 11. Upgrade appStateLoader to add syncFromBackend
const origStateLoader = `    const appStateLoader = {
      loadAll: () => {
        AppState.tickets = ticketRepository.getAll();
        AppState.attendance = attendanceRepository.get();
        AppState.leaves = leaveRepository.getAll();
        AppState.notices = noticeRepository.getAll();
        AppState.services = serviceRepository.getAll();
        AppState.assets = assetRepository.getAll();
        AppState.inventory = inventoryRepository.getAll();
        AppState.notifications = notificationRepository.getAll();
        appNotifications.renderDropdown();
      }
    };`;

const newStateLoader = `    const appStateLoader = {
      loadAll: () => {
        AppState.tickets = ticketRepository.getAll();
        AppState.attendance = attendanceRepository.get();
        AppState.leaves = leaveRepository.getAll();
        AppState.notices = noticeRepository.getAll();
        AppState.services = serviceRepository.getAll();
        AppState.assets = assetRepository.getAll();
        AppState.inventory = inventoryRepository.getAll();
        AppState.notifications = notificationRepository.getAll();
        appNotifications.renderDropdown();
      },
      syncFromBackend: async () => {
        try {
          const user = AppState.currentUser;
          const canSeeAssets = user && ['staff', 'admin'].includes(user.role);

          const fetches = [
            backendBridge.request('/tickets').then(r => {
              if (r && r.tickets) {
                AppState.tickets = r.tickets;
                localStorage.setItem(STORAGE_KEYS.tickets, JSON.stringify(r.tickets));
              }
            }).catch(() => {}),

            backendBridge.request('/attendance').then(r => {
              if (r && r.subjects) {
                AppState.attendance = {
                  threshold: r.threshold || 75,
                  subjects: r.subjects,
                  history: r.history || []
                };
                localStorage.setItem(STORAGE_KEYS.attendance, JSON.stringify(AppState.attendance));
              }
            }).catch(() => {}),

            backendBridge.request('/leaves').then(r => {
              if (r && r.leaves) {
                AppState.leaves = r.leaves;
                localStorage.setItem(STORAGE_KEYS.leaves, JSON.stringify(r.leaves));
              }
            }).catch(() => {}),

            backendBridge.request('/notices').then(r => {
              if (r && r.notices) {
                AppState.notices = r.notices;
                localStorage.setItem(STORAGE_KEYS.notices, JSON.stringify(r.notices));
              }
            }).catch(() => {}),

            backendBridge.request('/services').then(r => {
              if (r && r.services) {
                AppState.services = r.services;
                localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(r.services));
              }
            }).catch(() => {}),

            backendBridge.request('/notifications').then(r => {
              if (r && r.notifications) {
                AppState.notifications = r.notifications;
                localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(r.notifications));
              }
            }).catch(() => {}),

            backendBridge.request('/auth/roster').then(r => {
              if (r && r.roster) {
                AppState.roster = r.roster;
              }
            }).catch(() => {})
          ];

          if (canSeeAssets) {
            fetches.push(
              backendBridge.request('/assets').then(r => {
                if (r && r.assets) {
                  AppState.assets = r.assets;
                  localStorage.setItem(STORAGE_KEYS.assets, JSON.stringify(r.assets));
                }
              }).catch(() => {}),

              backendBridge.request('/inventory').then(r => {
                if (r && r.inventory) {
                  AppState.inventory = r.inventory;
                  localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(r.inventory));
                }
              }).catch(() => {})
            );
          }

          await Promise.all(fetches);
          appNotifications.renderDropdown();
          appNav.renderNavigation();
          appModuleRenderer.render(AppState.activeModule);
        } catch (err) {
          console.warn('[Sync Error]', err.message);
        }
      }
    };`;

content = content.replace(origStateLoader, newStateLoader);

// 12. Upgrade markAffected to dispatch API
content = content.replace(
  `        ticket.affectedBy.push(user.id);
        ticket.affectedCount = ticket.affectedBy.length;
        ticketRepository.saveAll(AppState.tickets);
        appUI.showToast('Impact Recorded', 'Your support has been registered to boost this ticket priority.', 'success');`,
  `        ticket.affectedBy.push(user.id);
        ticket.affectedCount = (ticket.affectedCount || 0) + 1;
        ticketRepository.saveAll(AppState.tickets);
        backendBridge.request(\`/tickets/\${ticketId}/endorse\`, { method: 'POST' }).catch(() => {});
        appUI.showToast('Impact Recorded', 'Your support has been registered to boost this ticket priority.', 'success');`
);

// 13. Upgrade saveRosterAttendance to dispatch API
content = content.replace(
  `        attendanceRepository.save(att);
        appUI.showToast('Attendance Recorded', \`Saved for \${AppState.roster.length} students in \${subject} (\${presentCount} present, \${AppState.roster.length - presentCount} absent).\`, 'success');`,
  `        attendanceRepository.save(att);
        backendBridge.request('/attendance/roster', {
          method: 'POST',
          body: JSON.stringify({
            subject,
            date,
            records: AppState.roster.map(st => {
              const activeBtn = document.querySelector(\`#seg-\${st.id} .segmented-btn.active\`);
              return {
                studentId: st.id,
                status: activeBtn ? activeBtn.getAttribute('data-status') : 'Present'
              };
            })
          })
        }).catch(() => {});
        appUI.showToast('Attendance Recorded', \`Saved for \${AppState.roster.length} students in \${subject} (\${presentCount} present, \${AppState.roster.length - presentCount} absent).\`, 'success');`
);

// 14. Upgrade saveThreshold to dispatch API
content = content.replace(
  `        AppState.attendance.threshold = val;
        attendanceRepository.save(AppState.attendance);`,
  `        AppState.attendance.threshold = val;
        attendanceRepository.save(AppState.attendance);
        backendBridge.request('/attendance/threshold', {
          method: 'PATCH',
          body: JSON.stringify({ threshold: val })
        }).catch(() => {});`
);

// 15. Upgrade appReset to dispatch API
content = content.replace(
  `            notificationRepository.saveAll(AppState.notifications);

            appUI.showToast('Demo State Reset', 'CampusOS factory demo data restored successfully.', 'success');`,
  `            notificationRepository.saveAll(AppState.notifications);
            backendBridge.request('/system/reset', { method: 'POST' })
              .then(() => appStateLoader.syncFromBackend())
              .catch(() => {});
            appUI.showToast('Demo State Reset', 'CampusOS factory demo data restored successfully.', 'success');`
);

// Write to all target locations
const targets = [
  path.join(__dirname, '..', 'campusos-v1.2.html'),
  path.join(__dirname, '..', 'index.html'),
  path.join(__dirname, '..', 'public', 'campusos-v1.2.html'),
  path.join(__dirname, '..', 'public', 'index.html')
];

for (const t of targets) {
  fs.writeFileSync(t, content, 'utf8');
  console.log('✅ Integrated frontend saved to:', t);
}
