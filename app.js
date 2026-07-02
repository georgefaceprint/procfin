

// Global Wizard State for Multi-Step Form
window.wizard = {
    category: '',
    amount: 500000,
    supplierChoice: '',
    
    selectCategory: function(cat, el) {
        this.category = cat;
        document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('selected'));
        el.classList.add('selected');
        setTimeout(() => this.nextStep(2), 400); // Auto advance
    },

    selectSupplierChoice: function(choice, el) {
        this.supplierChoice = choice;
        document.querySelectorAll('.supplier-card').forEach(c => c.classList.remove('selected'));
        el.classList.add('selected');
        setTimeout(() => this.nextStep(4), 400); // Auto advance to final step
    },

    nextStep: function(step) {
        document.querySelectorAll('.wizard-step').forEach(s => s.classList.add('hidden'));
        document.getElementById('step-' + step).classList.remove('hidden');
        
        // Update progress bar
        document.getElementById('wiz-progress').style.width = ((step / 4) * 100) + '%';
        document.getElementById('wiz-step-text').innerText = 'Step ' + step + ' of 4';

        if (step === 2 && this.category) {
            document.getElementById('wiz-cat-display').innerText = 'Funding for ' + this.category;
        }
    },

    submitLead: function() {
        const name = document.getElementById('lead-name').value;
        const company = document.getElementById('lead-company').value;
        const whatsapp = document.getElementById('lead-whatsapp').value;
        
        if (!name || !company || !whatsapp) {
            alert('Please fill in your Name, Company, and WhatsApp Number to proceed.');
            return;
        }
        // Redirect to Auth after lead capture
        app.showAuth('SME');
    }
};

            <!-- Multi-Step Funding Wizard -->
            <section class="features-section" id="wizard" style="margin-top: 6rem; position: relative;">
                <h2 style="font-size: 2.5rem; margin-bottom: 1rem;">Calculate & Apply</h2>
                <p class="subtext" style="max-width: 600px; margin: 0 auto 3rem auto;">Find out exactly what your Purchase Order financing will cost, and get pre-approved in under 60 seconds.</p>
                
                <div class="glass-card" style="max-width: 800px; margin: 0 auto; text-align: left; padding: 2rem;">
                    
                    <!-- Progress Bar -->
                    <div style="margin-bottom: 2rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;" class="subtext">
                            <span id="wiz-step-text" style="font-weight: 700; color: var(--accent-cyan);">Step 1 of 4</span>
                        </div>
                        <div class="progress-bar" style="height: 6px; background: rgba(255,255,255,0.1);">
                            <div id="wiz-progress" class="progress" style="width: 25%; background: var(--accent-cyan); transition: width 0.3s ease;"></div>
                        </div>
                    </div>

                    <!-- Step 1: Category -->
                    <div id="step-1" class="wizard-step">
                        <h3 style="margin-bottom: 1.5rem;">What industry is your Purchase Order in?</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
                            <div class="cat-card" onclick="window.wizard.selectCategory('Construction & Mining', this)">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏗️</div>
                                <div>Construction</div>
                            </div>
                            <div class="cat-card" onclick="window.wizard.selectCategory('IT & Tech', this)">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">💻</div>
                                <div>IT & Tech</div>
                            </div>
                            <div class="cat-card" onclick="window.wizard.selectCategory('Medical Supplies', this)">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏥</div>
                                <div>Medical</div>
                            </div>
                            <div class="cat-card" onclick="window.wizard.selectCategory('Logistics', this)">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🚚</div>
                                <div>Logistics</div>
                            </div>
                            <div class="cat-card" onclick="window.wizard.selectCategory('Other', this)">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚡</div>
                                <div>Other</div>
                            </div>
                        </div>
                    </div>

                    <!-- Step 2: Calculator -->
                    <div id="step-2" class="wizard-step hidden">
                        <h3 id="wiz-cat-display" style="margin-bottom: 1.5rem; color: var(--accent-cyan);">Funding Request</h3>
                        <div style="margin-bottom: 2rem;">
                            <label style="display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 1rem; font-size: 1.2rem;">
                                <span>Purchase Order Value</span>
                                <span id="calc-principal-display" style="color: white; font-size: 1.5rem;">R 500,000</span>
                            </label>
                            <input type="range" id="calc-slider" min="50000" max="5000000" step="10000" value="500000" class="custom-slider" oninput="
                                const val = parseInt(this.value);
                                window.wizard.amount = val;
                                const fee = val * 0.20;
                                const total = val + fee;
                                const format = (num) => 'R ' + num.toLocaleString('en-ZA');
                                document.getElementById('calc-principal-display').innerText = format(val);
                                document.getElementById('calc-fee').innerText = format(fee);
                                document.getElementById('calc-total').innerText = format(total);
                            ">
                            <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;" class="subtext">
                                <span>R 50,000</span>
                                <span>R 5,000,000</span>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border);">
                            <div>
                                <p class="subtext" style="margin-bottom: 0.5rem;">ProcFin Escrow Fee (20% flat)</p>
                                <h3 id="calc-fee" style="font-size: 1.8rem; color: var(--text-muted);">R 100,000</h3>
                            </div>
                            <div>
                                <p class="subtext" style="margin-bottom: 0.5rem; font-weight: 700; color: white;">Total Repayment (in 60 Days)</p>
                                <h3 id="calc-total" style="font-size: 2.2rem; color: var(--accent-cyan);">R 600,000</h3>
                            </div>
                        </div>

                        <div style="display: flex; gap: 1rem;">
                            <button class="btn btn-outline" style="flex: 1;" onclick="window.wizard.nextStep(1)">Back</button>
                            <button class="btn btn-primary" style="flex: 2;" onclick="window.wizard.nextStep(3)">Next</button>
                        </div>
                    </div>

                    <!-- Step 3: Supplier Choice -->
                    <div id="step-3" class="wizard-step hidden">
                        <h3 style="margin-bottom: 0.5rem;">Procurement & Suppliers</h3>
                        <p class="subtext" style="margin-bottom: 2rem;">ProcFin pays suppliers directly to guarantee delivery. Do you have a supplier ready?</p>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                            <div class="cat-card supplier-card" onclick="window.wizard.selectSupplierChoice('has_supplier', this)" style="padding: 2rem 1rem;">
                                <div style="font-size: 2rem; margin-bottom: 1rem;">✅</div>
                                <div style="font-weight: 700;">Yes, I have a supplier</div>
                                <div class="subtext" style="font-size: 0.85rem; margin-top: 0.5rem;">We will vet and pay them directly on your behalf.</div>
                            </div>
                            <div class="cat-card supplier-card" onclick="window.wizard.selectSupplierChoice('needs_supplier', this)" style="padding: 2rem 1rem;">
                                <div style="font-size: 2rem; margin-bottom: 1rem;">🤝</div>
                                <div style="font-weight: 700;">Match me with one</div>
                                <div class="subtext" style="font-size: 0.85rem; margin-top: 0.5rem;">Choose from our database of verified in-house suppliers.</div>
                            </div>
                        </div>

                        <div style="display: flex; gap: 1rem;">
                            <button class="btn btn-outline" style="flex: 1;" onclick="window.wizard.nextStep(2)">Back</button>
                        </div>
                    </div>

                    <!-- Step 4: Lead Capture -->
                    <div id="step-4" class="wizard-step hidden">
                        <h3 style="margin-bottom: 0.5rem;">Almost there!</h3>
                        <p class="subtext" style="margin-bottom: 2rem;">Enter your WhatsApp number so our agents can reach out instantly with approval details.</p>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <input type="text" id="lead-name" class="form-input" placeholder="Full Name" style="width: 100%; box-sizing: border-box;" required>
                            <input type="text" id="lead-company" class="form-input" placeholder="Company Name" style="width: 100%; box-sizing: border-box;" required>
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <input type="email" id="lead-email" class="form-input" placeholder="Email Address" style="width: 100%; margin-bottom: 1rem; box-sizing: border-box;" required>
                            
                            <!-- WhatsApp Specific Input -->
                            <div style="position: relative;">
                                <div style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #25D366; font-size: 1.2rem;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                </div>
                                <input type="tel" id="lead-whatsapp" class="form-input" placeholder="WhatsApp Number" style="width: 100%; box-sizing: border-box; padding-left: 3.2rem; border-color: rgba(37, 211, 102, 0.5);" required>
                            </div>
                        </div>

                        <div style="display: flex; gap: 1rem;">
                            <button class="btn btn-outline" style="flex: 1;" onclick="window.wizard.nextStep(3)">Back</button>
                            <button class="btn btn-primary" style="flex: 2;" onclick="window.wizard.submitLead()">Submit Funding Request</button>
                        </div>
                    </div>

                </div>
            </section>



            <!-- Feature Showcase -->
            <section class="features-section" id="how-it-works" style="margin-bottom: 4rem;">
                <h2 style="font-size: 2.5rem; margin-bottom: 1rem;">A Seamless Ecosystem</h2>
                <p class="subtext" style="max-width: 600px; margin: 0 auto;">ProcFin integrates every step of the procurement process to ensure maximum security for funders and seamless capital for SMEs.</p>
                
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">🔒</div>
                        <h3>Digital Vault</h3>
                        <p class="subtext">Upload your compliance documents once. Our secure digital vault ensures instant KYC and fast-tracks your funding applications.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🤝</div>
                        <h3>Smart Matchmaking</h3>
                        <p class="subtext">Get connected with vetted funders ready to deploy capital for your specific tender category and verified suppliers.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">⚖️</div>
                        <h3>Secure Escrow</h3>
                        <p class="subtext">Capital is locked in escrow. ProcFin pays suppliers directly upon proof of delivery, completely neutralizing fund mismanagement.</p>
                    </div>
                </div>
            </section>
        `);
    },

    showAuth(intentType = null, method = 'select') {
        if (!intentType) {
            this.setView(`
            <div class="auth-wrapper hero-enter" style="max-width: 600px; margin: 4rem auto; text-align: center;">
                <h2 style="margin-bottom: 0.5rem; font-size: 2rem; font-family: var(--font-heading);">Welcome to ProcFin</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem; font-size: 1rem;">Please select how you want to use the platform to continue.</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div class="glass-card" style="cursor: pointer; padding: 2rem 1rem; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 25px rgba(59,130,246,0.1)';" onmouseout="this.style.transform='none'; this.style.boxShadow='none';" onclick="app.showAuth('SME')">
                        <div class="icon-circle" style="background: rgba(59, 130, 246, 0.1); color: var(--primary); margin: 0 auto 1rem auto;">🏢</div>
                        <h4>Business (SME)</h4>
                        <p class="subtext" style="font-size: 0.85rem; margin-top: 0.5rem;">Apply for funding & tenders</p>
                    </div>
                    
                    <div class="glass-card" style="cursor: pointer; padding: 2rem 1rem; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 25px rgba(139,92,246,0.1)';" onmouseout="this.style.transform='none'; this.style.boxShadow='none';" onclick="app.showAuth('FUNDER')">
                        <div class="icon-circle" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6; margin: 0 auto 1rem auto;">💎</div>
                        <h4>Funder Portal</h4>
                        <p class="subtext" style="font-size: 0.85rem; margin-top: 0.5rem;">Platform funder access</p>
                    </div>
                    
                    <div class="glass-card" style="cursor: pointer; padding: 2rem 1rem; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 25px rgba(16,185,129,0.1)';" onmouseout="this.style.transform='none'; this.style.boxShadow='none';" onclick="app.showAuth('SUPPLIER')">
                        <div class="icon-circle" style="background: rgba(16, 185, 129, 0.1); color: var(--accent); margin: 0 auto 1rem auto;">🚚</div>
                        <h4>Supplier</h4>
                        <p class="subtext" style="font-size: 0.85rem; margin-top: 0.5rem;">Quote on SME RFQs</p>
                    </div>
                </div>
            </div>
            `);
            return;
        }

        if (method === 'email') {
            this.setView(`
                <div class="auth-wrapper hero-enter" style="max-width: 450px; margin: 4rem auto;">
                    <button class="btn btn-secondary btn-sm" style="margin-bottom: 2rem;" onclick="app.showAuth('${intentType}', 'select')">&larr; Back to Options</button>
                    <h2 style="margin-bottom: 0.5rem; font-size: 2rem; font-family: var(--font-heading);">Email Access</h2>
                    <div class="badge" style="margin-bottom: 1.5rem; background: rgba(59,130,246,0.1); color: var(--primary);">Accessing as: ${intentType}</div>
                    
                    <div class="glass-card" style="text-align: left; padding: 2.5rem 2rem;">
                        <form onsubmit="app.processEmailAuth(event, '${intentType}')">
                            <div class="form-group">
                                <label>Email Address</label>
                                <input type="email" name="email" class="form-control" required placeholder="you@company.com">
                            </div>
                            <div class="form-group">
                                <label>Password</label>
                                <input type="password" name="password" class="form-control" required minlength="6" placeholder="••••••••">
                            </div>
                            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                                <button type="submit" name="action" value="login" class="btn btn-outline" style="flex: 1;">Log In</button>
                                <button type="submit" name="action" value="register" class="btn btn-primary" style="flex: 1;">Register</button>
                            </div>
                        </form>
                    </div>
                </div>
            `);
            return;
        }

        this.setView(`
            <div class="auth-wrapper hero-enter" style="max-width: 450px; margin: 4rem auto;">
                <button class="btn btn-secondary btn-sm" style="margin-bottom: 2rem;" onclick="app.showAuth()">&larr; Change Role</button>
                <h2 style="margin-bottom: 0.5rem; font-size: 2rem; font-family: var(--font-heading);">Sign In / Join</h2>
                <div class="badge" style="margin-bottom: 1.5rem; background: rgba(59,130,246,0.1); color: var(--primary);">Accessing as: ${intentType}</div>
                <p style="color: var(--text-muted); margin-bottom: 2rem; font-size: 0.9rem;">Please choose an authentication method to log into your ProcFin account.</p>
                
                <div class="glass-card" style="text-align: center; padding: 3rem 2rem;">
                    
                    <button class="btn btn-primary btn-large" style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 1rem;" onclick="app.login('${intentType}', 'google')">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                    </button>
                    
                    <button class="btn btn-outline btn-large" style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 1rem;" onclick="app.login('${intentType}', 'apple')">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16.365 20.675C15.115 21.6 13.905 22.025 12 22C10.155 22.025 8.875 21.6 7.635 20.675C5.165 18.845 2.625 14.185 4.305 9.775C5.145 7.575 7.035 6.125 9.175 6.125C10.745 6.125 11.975 6.845 12.875 6.845C13.805 6.845 15.255 5.995 17.155 5.995C18.675 5.995 20.465 6.675 21.575 8.045C21.495 8.105 18.825 9.685 18.825 12.845C18.825 16.595 22.155 17.895 22.195 17.915C22.145 18.065 21.655 19.825 20.575 21.415C19.555 22.925 18.435 24.365 16.825 24.365C15.225 24.365 14.735 23.365 12.865 23.365C10.985 23.365 10.425 24.325 8.905 24.325C7.385 24.325 6.135 22.755 5.075 21.235C2.885 18.085.875 12.385 3.125 9.145C4.245 7.525 5.985 6.545 7.825 6.545C9.375 6.545 10.745 7.575 11.725 7.575C12.705 7.575 14.395 6.325 16.295 6.325C17.655 6.325 19.505 6.945 20.655 8.415L20.665 8.425C18.155 9.945 18.415 13.575 21.105 14.715C20.505 16.395 19.335 18.445 18.065 20.275C17.585 20.945 17.125 21.565 16.715 22.055L16.365 20.675ZM15.265 4.185C16.095 3.165 16.655 1.835 16.505.495C15.355.545 13.935 1.285 13.085 2.305C12.335 3.205 11.665 4.585 11.835 5.885C13.115 5.985 14.435 5.205 15.265 4.185Z"/></svg>
                        Continue with Apple
                    </button>
                    
                    <button class="btn btn-outline btn-large" style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 1rem;" onclick="app.showAuth('${intentType}', 'email')">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2" ry="2"/><polyline points="3 7 12 13 21 7"/></svg>
                        Continue with Email
                    </button>
                    
                    <button class="btn btn-outline btn-large" style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 1rem;" onclick="app.login('${intentType}', 'phone')">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        Continue with Phone
                    </button>

                    <p style="margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
                        By continuing, you agree to our Terms and Privacy Policy. All major authentication providers supported.
                    </p>
                </div>
            </div>
        `);
    },

    provincesSA: [
        "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
        "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"
    ],

    onboardingSteps: [
        { title: "Business Identity", subtitle: "Define your company legal name and registration type." },
        { title: "Industry & Category", subtitle: "Tell us what industry you operate in for better matching." },
        { title: "Location Details", subtitle: "Verification of your physical operating presence in South Africa." },
        { title: "KYC & Compliance", subtitle: "Initial document setup to enable platform transactions." }
    ],

    showOnboarding(step = 1) {
        this.currentView = 'onboarding';
        const total = this.onboardingSteps.length;
        const progress = Math.round((step / total) * 100);
        const currentData = this.user.onboardingData || {};

        this.setView(`
            <div class="hero-enter" style="max-width: 600px; margin: 3rem auto;">
                <div style="margin-bottom: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.5rem;">
                        <h4 style="font-family: var(--font-heading); color: var(--primary);">Step ${step} of ${total}</h4>
                        <span class="subtext">${progress}% Complete</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: var(--secondary); border-radius: 4px; overflow: hidden;">
                        <div style="width: ${progress}%; height: 100%; background: var(--primary); transition: width 0.5s ease;"></div>
                    </div>
                </div>

                <div class="glass-card" style="padding: 2.5rem;">
                    <h2 style="margin-bottom: 0.5rem;">${this.onboardingSteps[step - 1].title}</h2>
                    <p class="subtext" style="margin-bottom: 2rem;">${this.onboardingSteps[step - 1].subtitle}</p>

                    <form onsubmit="event.preventDefault(); app.saveOnboardingStep(${step}, this);">
                        ${step === 1 ? `
                            <div class="form-group">
                                <label>Registered ${this.user.type === 'SUPPLIER' ? 'Supplier Name' : 'Company Name'}</label>
                                <input type="text" name="companyName" class="form-control" placeholder="e.g. Acme ${this.user.type === 'SUPPLIER' ? 'Supplies' : 'Printing'} (Pty) Ltd" value="${currentData.companyName || ''}" required>
                            </div>
                            ${this.user.type === 'SUPPLIER' ? `
                            <div class="form-group">
                                <label>Email Address</label>
                                <input type="email" class="form-control" value="${this.user.email}" readonly style="opacity: 0.7;">
                            </div>
                            <div class="form-group">
                                <label>Phone Number</label>
                                <input type="tel" name="phone" class="form-control" placeholder="+27 82 123 4567" value="${currentData.phone || ''}" required>
                            </div>
                            ` : `
                            <div class="form-group">
                                <label>Registration Number (CIPC)</label>
                                <input type="text" name="regNumber" class="form-control" placeholder="YYYY/NNNNNN/NN" value="${currentData.regNumber || ''}" required>
                            </div>
                            `}
                        ` : ''}

                        ${step === 2 ? `
                            <div class="form-group">
                                <label>Primary Industry</label>
                                <select name="industry" class="form-control" required>
                                    <option value="">Select Industry</option>
                                    <option value="Construction" ${currentData.industry === 'Construction' ? 'selected' : ''}>Construction & Infrastructure</option>
                                    <option value="Manufacturing" ${currentData.industry === 'Manufacturing' ? 'selected' : ''}>Manufacturing</option>
                                    <option value="Agriculture" ${currentData.industry === 'Agriculture' ? 'selected' : ''}>Agriculture</option>
                                    <option value="Retail" ${currentData.industry === 'Retail' ? 'selected' : ''}>Retail & Wholesale</option>
                                    <option value="Services" ${currentData.industry === 'Services' ? 'selected' : ''}>Professional Services</option>
                                    <option value="Logistics" ${currentData.industry === 'Logistics' ? 'selected' : ''}>Logistics & Transport</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>${this.user.type === 'SUPPLIER' ? 'Supply Category / Mandate' : 'Funding Category Needs'}</label>
                                <p class="subtext" style="font-size: 0.8rem; margin-top: 5px;">Hold Cmd/Ctrl to select multiple (Max 5)</p>
                                <select name="preferredCategory" class="form-control" multiple required size="5">
                                    ${this.fundingCategories.map(c => `
                                        <option value="${c.name}" ${Array.isArray(currentData.preferredCategory) && currentData.preferredCategory.includes(c.name) ? 'selected' : (currentData.preferredCategory === c.name ? 'selected' : '')}>${c.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                            ${this.user.type === 'SUPPLIER' ? `
                            <div class="form-group">
                                <label>Years in Business</label>
                                <input type="number" name="yearsInBusiness" class="form-control" placeholder="e.g. 5" value="${currentData.yearsInBusiness || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>Annual Turnover (ZAR)</label>
                                <select name="annualTurnover" class="form-control" required>
                                    <option value="">Select Range</option>
                                    <option value="< R1M" ${currentData.annualTurnover === '< R1M' ? 'selected' : ''}>Under R1M</option>
                                    <option value="R1M - R5M" ${currentData.annualTurnover === 'R1M - R5M' ? 'selected' : ''}>R1M - R5M</option>
                                    <option value="R5M - R20M" ${currentData.annualTurnover === 'R5M - R20M' ? 'selected' : ''}>R5M - R20M</option>
                                    <option value="> R20M" ${currentData.annualTurnover === '> R20M' ? 'selected' : ''}>Over R20M</option>
                                </select>
                            </div>
                            ` : ''}
                        ` : ''}

                        ${step === 3 ? `
                            <div class="form-group">
                                <label>Province</label>
                                <select name="province" class="form-control" required>
                                    <option value="">Select Province</option>
                                    ${this.provincesSA.map(p => `<option value="${p}" ${currentData.province === p ? 'selected' : ''}>${p}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Physical Business Address</label>
                                <textarea name="address" class="form-control" rows="3" placeholder="Street, City, Postal Code" required>${currentData.address || ''}</textarea>
                            </div>
                        ` : ''}

                        ${step === 4 ? `
                            <div style="background: rgba(59, 130, 246, 0.05); padding: 1.5rem; border-radius: 8px; border: 1px dashed var(--border); margin-bottom: 2rem; text-align: center;">
                                <h4 style="margin-bottom: 0.5rem;">Document Setup Ready</h4>
                                <p class="subtext" style="font-size: 0.85rem;">Your identity and registration documents will be managed in your <strong>Secure Vault</strong> after onboarding.</p>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: flex-start; gap: 0.8rem; cursor: pointer;">
                                    <input type="checkbox" required style="margin-top: 0.3rem;">
                                    <span style="font-size: 0.9rem;">I confirm that all provided details are legally accurate and represent ${currentData.companyName || 'the business'}.</span>
                                </label>
                            </div>
                        ` : ''}

                        <div style="display: flex; justify-content: space-between; margin-top: 3rem;">
                            ${step > 1 ? `<button type="button" class="btn btn-outline" onclick="app.showOnboarding(${step - 1})">Back</button>` : '<div></div>'}
                            <button type="submit" class="btn btn-primary">${step === total ? 'Complete Onboarding' : 'Continue'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `);
    },

    async saveOnboardingStep(step, form) {
        event.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Handle multi-select for categories manually
        const categorySelect = form.querySelector('select[name="preferredCategory"]');
        if (categorySelect && categorySelect.multiple) {
            const selectedOptions = Array.from(categorySelect.selectedOptions).map(opt => opt.value);
            if (selectedOptions.length > 5) {
                alert("Error: Maximum 5 industry categories allowed.");
                return;
            }
            if (selectedOptions.length === 0) {
                alert("Please select at least one category.");
                return;
            }
            data.preferredCategory = selectedOptions;
        }

        const total = this.onboardingSteps.length;

        // Update local user state
        this.user.onboardingData = { ...(this.user.onboardingData || {}), ...data };

        if (step === total) {
            this.user.onboardingComplete = true;
            this.user.onboardingStep = total;
            // Map onboarding data to user profile
            this.user.name = this.user.onboardingData.companyName || this.user.name;

            if (this.user.type === 'SME') {
                this.user.regNum = this.user.onboardingData.regNumber || this.user.regNum;
                this.user.address = this.user.onboardingData.address || this.user.address;
                this.user.province = this.user.onboardingData.province || this.user.province;
                this.user.industry = this.user.onboardingData.preferredCategory || this.user.industry;
            }
            if (this.user.type === 'SUPPLIER') {
                this.user.phone = this.user.onboardingData.phone || this.user.phone;
                this.user.industry = this.user.onboardingData.preferredCategory || this.user.industry;
                this.user.address = this.user.onboardingData.address || this.user.address;
                this.user.province = this.user.onboardingData.province || this.user.province;
                this.user.yearsInBusiness = this.user.onboardingData.yearsInBusiness;
                this.user.annualTurnover = this.user.onboardingData.annualTurnover;
            }
        } else {
            this.user.onboardingStep = step + 1;
        }

        try {
            const userRef = doc(db, "users", this.user.id);
            await setDoc(userRef, this.user, { merge: true });

            localStorage.setItem(STORE_KEY, JSON.stringify(this.user));

            if (this.user.onboardingComplete) {
                alert("Welcome aboard! Your ProcFin profile is now live.");
                this.showDashboard();
            } else {
                this.showOnboarding(this.user.onboardingStep);
            }
        } catch (error) {
            console.error("Onboarding Save Error:", error);
            alert("System Error: Failed to save progress.");
        }
    },

    showUserProfile() {
        this.setView(`
            <div class="hero-enter" style="max-width: 600px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back to Dashboard</button>
                <h2>My Profile</h2>
                <p class="subtext" style="margin-bottom: 2rem;">Manage your public identity, contact information, and platform role details.</p>

                <div class="glass-card">
                    <form onsubmit="app.saveUserProfile(event)">
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 2rem;">
                            <div style="width: 100px; height: 100px; border-radius: 50%; background: var(--bg-hover); border: 2px dashed var(--border); display: flex; align-items: center; justify-content: center; font-size: 3rem; color: var(--primary); margin-bottom: 1rem;">
                                ${this.user.name.charAt(0).toUpperCase()}
                            </div>
                            <span class="badge" style="background: rgba(59, 130, 246, 0.1); color: var(--primary); text-transform: uppercase;">Profile Role: ${this.user.type || 'Standard'}</span>
                        </div>

                        <div class="form-group">
                            <label>Full Name / Company Name</label>
                            <input type="text" class="form-control" id="profileName" value="${this.user.name}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Email Address</label>
                            <input type="email" class="form-control" id="profileEmail" value="${this.user.email}" readonly style="opacity: 0.7; cursor: not-allowed;">
                            <small class="subtext" style="font-size: 0.8rem; margin-top: 0.3rem; display: block;">Emails are tied to your authentication provider.</small>
                        </div>

                        <div class="form-group">
                            <label>Phone Number</label>
                            <input type="tel" class="form-control" id="profilePhone" value="${this.user.phone || ''}" placeholder="+27 82 123 4567">
                        </div>

                        ${this.user.type === 'SME' ? `
                        <div class="form-group">
                            <label>CIPC Registration Number</label>
                            <input type="text" class="form-control" id="profileRegNum" value="${this.user.regNum || ''}" placeholder="2024/123456/07">
                        </div>
                        <div class="form-group">
                            <label>Physical Address</label>
                            <input type="text" class="form-control" id="profileAddress" value="${this.user.address || ''}" placeholder="123 Business Street, Province">
                        </div>
                        <div class="form-group">
                            <label>Verified Categories</label>
                            <input type="text" class="form-control" id="profileIndustry" value="${Array.isArray(this.user.industry) ? this.user.industry.join(', ') : (this.user.industry || '')}" readonly style="opacity: 0.7; cursor: not-allowed;">
                        </div>
                        ` : ''}

                        ${this.user.type === 'SUPPLIER' ? `
                        <div class="form-group">
                            <label>Verified Industry/Mandate</label>
                            <input type="text" class="form-control" id="profileIndustry" value="${Array.isArray(this.user.industry) ? this.user.industry.join(', ') : (this.user.industry || '')}" readonly style="opacity: 0.7; cursor: not-allowed;">
                        </div>
                        ` : ''}

                        <button type="submit" class="btn btn-primary btn-large" style="width: 100%; margin-top: 1rem;">
                            Save Profile Changes
                        </button>
                    </form>
                </div>
            </div>
        `);
    },

    async saveUserProfile(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const ogText = btn.innerHTML;
        btn.innerHTML = '<span class="status pulse">Saving...</span>';
        btn.disabled = true;

        try {
            const updates = {
                name: document.getElementById('profileName').value,
                phone: document.getElementById('profilePhone').value
            };

            if (this.user.type === 'SME') {
                updates.regNum = document.getElementById('profileRegNum').value;
                updates.address = document.getElementById('profileAddress').value;
            }

            const userRef = doc(db, "users", this.user.id);
            await setDoc(userRef, updates, { merge: true });

            // Update local state
            this.user = { ...this.user, ...updates };
            localStorage.setItem(STORE_KEY, JSON.stringify(this.user));

            app.renderNavbar();

            setTimeout(() => {
                btn.innerHTML = 'Saved Successfully!';
                btn.style.background = '#10b981';
                setTimeout(() => {
                    btn.innerHTML = ogText;
                    btn.disabled = false;
                    btn.style.background = 'var(--primary)';
                }, 2000);
            }, 500);

        } catch (error) {
            console.error("Error saving profile", error);
            alert("Failed to save profile. Please try again.");
            btn.innerHTML = ogText;
            btn.disabled = false;
        }
    },

    showDashboard() {
        if (!this.user) return this.showAuth();

        // Ensure onboarding is complete if not Admin
        if (this.user.type !== 'ADMIN' && !this.user.onboardingComplete) {
            return this.showOnboarding(this.user.onboardingStep || 1);
        }

        this.setView(`
            <div class="hero-enter" style="margin-top: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2>Welcome, ${this.user.name}</h2>
                    ${this.user.type === 'SME' && this.user.subscribed ? `
                        <div style="display: flex; gap: 1rem;">
                            <button class="btn btn-secondary" onclick="app.showQuoteRequest()">Request Quote</button>
                            <button class="btn btn-primary" onclick="app.showFundingRequest()">Apply for Funding</button>
                        </div>
                    ` : ''}
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                    
                    ${this.user.type !== 'ADMIN' ? this.renderSuggestiveActions() : ''}
                    
                    ${this.user.type === 'SME' ? `
                    <div class="glass-card">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                            <div class="icon-circle" style="background: rgba(59, 130, 246, 0.1); color: var(--primary); margin: 0; width: 50px; height: 50px; font-size: 1.2rem;">🏢</div>
                            <div>
                                <h3 style="margin: 0;">${this.user.name}</h3>
                                <p class="subtext" style="font-size: 0.8rem;">SME Representative</p>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.8rem; border-top: 1px solid var(--border); padding-top: 1rem;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                                <span class="subtext">Account Status</span> <span style="color: var(--accent); font-weight: 600;">Verified Platform SME</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                                <span class="subtext">Categories</span> <span style="text-align: right; max-width: 60%;">${Array.isArray(this.user.industry) ? this.user.industry.join(', ') : (this.user.industry || 'None')}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                                <span class="subtext">Official Email</span> <span>${this.user.email}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                                <span class="subtext">ProcFin ID</span> <span style="font-family: monospace; font-size: 0.8rem;">PR-${this.user.id.substring(0, 8).toUpperCase()}</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                            <button class="btn btn-outline" style="flex: 1; padding: 0.5rem;" onclick="app.showUserProfile()">Edit Details</button>
                            <button class="btn btn-secondary" style="flex: 1; padding: 0.5rem;" onclick="app.showDocumentRepo()">My Vault</button>
                        </div>
                    </div>
                    ` : ''}

                    ${this.user.type === 'SME' ? (
                !this.user.subscribed ? `
                        <div class="glass-card" style="grid-column: 1 / -1; margin-top: 1rem;">
                            <div style="text-align: center; padding: 2rem 1rem; background: var(--secondary); border-radius: 8px;">
                                <h2 style="margin-bottom: 1rem;">Unlock Premium Access</h2>
                                <p style="margin-bottom: 2rem; max-width: 400px; margin-inline: auto;">Subscribe to request accurate quotes from verified national database suppliers and apply directly for funder capital.</p>
                                
                                <div style="display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap;">
                                    <div class="glass-card" style="text-align: left; min-width: 250px;">
                                        <h4 style="margin-bottom: 0.5rem;">SME Growth Plan</h4>
                                        <h2>R299<span style="font-size: 1rem; color: var(--text-muted); font-weight: 500;">/mo</span></h2>
                                        <ul style="margin: 1.5rem 0; padding-left: 1.5rem; text-align: left; line-height: 1.8;">
                                            <li>Unlimited quote requests</li>
                                            <li>Direct funding facility applications</li>
                                            <li>ProcFin milestone tracking mapping</li>
                                        </ul>
                                        <button class="btn btn-primary" style="width: 100%;" onclick="app.user.subscribed = true; app.showDashboard();">Subscribe Now</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ` : `
                        <div class="glass-card" style="grid-column: 1 / -1; margin-top: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                                <div>
                                    <h3>My Quotation Requests (RFQs)</h3>
                                    <p class="subtext">Track quotes received from verified suppliers and approve the best offer.</p>
                                </div>
                                <span class="status pulse">SME Pro Active</span>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                                ${this.rfqs.filter(r => r.smeId === this.user.id).length > 0 ?
                    this.rfqs.filter(r => r.smeId === this.user.id).map(rfq => `
                                    <div class="glass-card" style="background: var(--bg-color); border: 1px solid var(--border);">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                            <strong>${rfq.title}</strong>
                                            <span class="status" style="background: rgba(16, 185, 129, 0.1); color: var(--accent);">${rfq.status}</span>
                                        </div>
                                        <p class="subtext" style="font-size: 0.85rem; margin-bottom: 0.5rem;">Category: ${rfq.category} &bull; Delivery: ${rfq.location}</p>
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                            <span class="badge" style="background: rgba(59,130,246,0.1); color: var(--primary); margin: 0;">${rfq.quotes ? rfq.quotes.length : 0} Quotes Received</span>
                                        </div>
                                        ${rfq.quotes && rfq.quotes.length > 0 ? `
                                            <div style="border-top: 1px solid var(--border); padding-top: 1rem; text-align: right;">
                                                <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="app.showReviewQuotes('${rfq.id}')">Review ${rfq.quotes.length} Quotes</button>
                                            </div>
                                        ` : '<p class="subtext" style="font-size: 0.85rem; padding-top: 1rem; border-top: 1px solid var(--border);">Awaiting supplier quotes...</p>'}
                                    </div>
                                `).join('') : '<p class="subtext" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">You have no active quotation requests.</p>'}
                            </div>
                        </div>
                        `
            ) : ''}

                    ${this.user.type === 'FUNDER' ? `
                    <div class="glass-card" style="grid-column: 1 / -1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                            <div>
                                <h3>Deal Flow Pipeline</h3>
                                <p class="subtext">Review SME funding requests, structure deals, and generate binding contracts automatically.</p>
                            </div>
                            <span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--accent); border-color: rgba(16, 185, 129, 0.2);">Capital Deployed: R4.2M</span>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                            ${this.deals.length > 0 ? this.deals.map(deal => `
                            <div class="glass-card" style="background: var(--bg-color);">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <strong>${deal.smeName || 'SME'}</strong>
                                    <span class="status pulse" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">${deal.status}</span>
                                </div>
                                <h4>Request: R${Number(deal.amount).toLocaleString()}</h4>
                                <p class="subtext" style="margin-bottom: 1rem;">Category: ${deal.category}</p>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button class="btn btn-secondary" style="flex: 1; padding: 0.5rem; font-size: 0.85rem;" onclick="app.showFunderDocReview('${deal.smeId}')">Review Docs</button>
                                    <button class="btn btn-primary" style="flex: 1; padding: 0.5rem; font-size: 0.85rem;" onclick="app.showFunderOffer('${deal.id}')">Structure Deal</button>
                                </div>
                            </div>
                            `).join('') : '<p class="subtext">No active deals right now.</p>'}
                        </div>
                    </div>
                    ` : ''}

                    ${this.user.type === 'SUPPLIER' ? (
                !this.user.subscribed ? `
                        <div class="glass-card" style="grid-column: 1 / -1; margin-top: 1rem;">
                            <div style="text-align: center; padding: 2rem 1rem; background: var(--secondary); border-radius: 8px;">
                                <h2 style="margin-bottom: 1rem;">Start Quoting on Tenders</h2>
                                <p style="margin-bottom: 2rem; max-width: 400px; margin-inline: auto;">Subscribe as a Verified Supplier to receive direct quotation requests from funded SMEs and secure guaranteed payouts via ProcFin escrow.</p>
                                
                                <div style="display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap;">
                                    <div class="glass-card" style="text-align: left; min-width: 250px;">
                                        <h4 style="margin-bottom: 0.5rem;">Verified Supplier Plan</h4>
                                        <h2>R499<span style="font-size: 1rem; color: var(--text-muted); font-weight: 500;">/mo</span></h2>
                                        <ul style="margin: 1.5rem 0; padding-left: 1.5rem; text-align: left; line-height: 1.8;">
                                            <li>Instant RFQ Notifications</li>
                                            <li>Submit Unlimited Quotes</li>
                                            <li>Guaranteed Milestone Payouts</li>
                                        </ul>
                                        <button class="btn btn-primary" style="width: 100%;" onclick="app.showSubscriptionCheckout()">Become Verified</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ` : `
                        <div class="glass-card" style="grid-column: 1 / -1;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                                <div>
                                    <h3>Live RFQ Feed</h3>
                                    <p class="subtext">Available quotation requests matching your verified industry mandate.</p>
                                </div>
                                <span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--accent); border-color: rgba(16, 185, 129, 0.2);">Supplier ID: SA-9281</span>
                            </div>

                            ${this.rfqs.filter(r => {
                    const ind = this.user.industry;
                    return r.category === 'All' || (Array.isArray(ind) ? ind.includes(r.category) : ind === r.category) || !ind;
                }).map(rfq => `
                            <div style="border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; position: relative; opacity: ${rfq.status === 'Closed (Quote Accepted)' ? '0.5' : '1'};">
                                <span class="badge" style="position: absolute; top: 1.5rem; right: 1.5rem; margin: 0; background: rgba(59,130,246,0.1); color: var(--primary);">${rfq.status}</span>
                                
                                <div style="margin-bottom: 1rem; max-width: 80%;">
                                    <h4 style="margin: 0 0 0.5rem 0;">${rfq.title}</h4>
                                    <p class="subtext" style="margin: 0;">Buyer: ${rfq.smeName} • Delivery: ${rfq.location}</p>
                                </div>

                                <p style="font-size: 0.95rem; margin-bottom: 1.5rem; color: var(--text-color);">${rfq.specs}</p>

                                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 1rem;">
                                    <div>
                                        <span class="subtext" style="font-size: 0.85rem; display: block;">RFQ ID: ${rfq.id.substring(0, 8)} • ${rfq.quotes ? rfq.quotes.length : 0} Quotes Received</span>
                                        ${rfq.docUrl ? `<a href="${rfq.docUrl}" target="_blank" style="font-size: 0.85rem; color: var(--primary); text-decoration: underline; margin-top: 0.5rem; display: inline-block;">View Ref Document</a>` : ''}
                                    </div>
                                    ${rfq.status !== 'Closed (Quote Accepted)' ? `<button class="btn btn-primary btn-sm" onclick="app.showSubmitQuote('${rfq.id}')">Submit Custom Quote</button>` : `<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--accent);">Closed</span>`}
                                </div>
                            </div>
                            `).join('') || '<p class="subtext">No RFQs matching your category currently.</p>'}
                        </div>

                        <div class="glass-card" style="grid-column: 1 / -1; margin-top: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                                <div>
                                    <h3>Escrow Payouts & Active Contracts</h3>
                                    <p class="subtext">Upload proof of delivery (waybills) to trigger automatic milestone releases from the Funder Escrow.</p>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                                ${this.deals.filter(d => (d.status === 'Capital Secured' || d.status === 'Delivery Confirmed') && d.supplierName === this.user.name).map(deal => `
                                <div class="glass-card" style="background: var(--bg-color); border: 1px solid var(--accent);">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                        <strong>Active Contract: ${deal.category}</strong>
                                        <span class="status" style="background: rgba(16, 185, 129, 0.1); color: var(--accent);">${deal.status === 'Delivery Confirmed' ? '100% Paid' : '30% Paid (Upfront)'}</span>
                                    </div>
                                    <p class="subtext" style="margin-bottom: 1rem;">Funder: ${deal.funderName}<br>SME: ${deal.smeName}</p>
                                    <button class="btn btn-${deal.status === 'Delivery Confirmed' ? 'outline' : 'secondary'}" style="width: 100%; padding: 0.5rem;" onclick="app.showSupplierMilestones('${deal.id}')">${deal.status === 'Delivery Confirmed' ? 'View Details' : 'Upload Waybill'}</button>
                                </div>
                                `).join('') || '<p class="subtext">No active funded contracts yet.</p>'}
                            </div>
                        </div>
                        `
            ) : ''}

                ${this.user.type === 'ADMIN' ? `
                    <div style="grid-column: 1 / -1; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 0.5rem;">
                        <div class="glass-card" style="text-align: center; border-left: 4px solid var(--primary);">
                            <h3 style="font-size: 2.2rem; margin: 0; color: var(--primary);">${this.deals.length}</h3>
                            <p class="subtext">Active Funding Deals</p>
                        </div>
                        <div class="glass-card" style="text-align: center; border-left: 4px solid var(--accent);">
                            <h3 style="font-size: 2.2rem; margin: 0; color: var(--accent);">${this.rfqs.length}</h3>
                            <p class="subtext">Live Escrow RFQs</p>
                        </div>
                        <div class="glass-card" style="text-align: center; border-left: 4px solid #f59e0b;">
                            <h3 style="font-size: 2.2rem; margin: 0; color: #f59e0b;">${app.fundingCategories ? app.fundingCategories.length : 0}</h3>
                            <p class="subtext">Mandate Categories</p>
                        </div>
                    </div>

                    <div class="glass-card" style="grid-column: 1 / -1; margin-bottom: 2rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <div>
                                <h3 style="font-family: 'Outfit', sans-serif; font-weight: 700;">Platform Control Center</h3>
                                <p class="subtext">System-wide management of compliance, categories, and users.</p>
                            </div>
                            <span class="badge" style="background: rgba(220, 38, 38, 0.1); color: #dc2626; border: 1px solid rgba(220, 38, 38, 0.2);">Root Admin Access</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem;">
                            <div class="glass-card admin-module-card" onclick="app.showAdminDashboard()">
                                <div class="icon-circle" style="background: rgba(59, 130, 246, 0.1); color: var(--primary);">📄</div>
                                <h4 style="margin: 1rem 0 0.5rem 0;">Compliance Engine</h4>
                                <p class="subtext" style="font-size: 0.85rem;">Manage mandatory CSD, Tax, and FICA document requirements across all roles.</p>
                            </div>
                            <div class="glass-card admin-module-card" onclick="app.showAdminCategories()">
                                <div class="icon-circle" style="background: rgba(16, 185, 129, 0.1); color: var(--accent);">🏷️</div>
                                <h4 style="margin: 1rem 0 0.5rem 0;">Funding Categories</h4>
                                <p class="subtext" style="font-size: 0.85rem;">Update the platform taxonomy and matching logic for SME funding requests.</p>
                            </div>
                            <div class="glass-card admin-module-card" onclick="app.showAdminUsers()">
                                <div class="icon-circle" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">👥</div>
                                <h4 style="margin: 1rem 0 0.5rem 0;">User Management</h4>
                                <p class="subtext" style="font-size: 0.85rem;">Audit the entire user base including SMEs, Funders, and Suppliers.</p>
                            </div>
                            <div class="glass-card admin-module-card" onclick="app.showAdminFunderApproval()">
                                <div class="icon-circle" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">🛡️</div>
                                <h4 style="margin: 1rem 0 0.5rem 0;">Funder Verification</h4>
                                <p class="subtext" style="font-size: 0.85rem;">Approve or reject high-net-worth individuals and corporate funding entities.</p>
                            </div>
                            <div class="glass-card admin-module-card" onclick="app.showAdminActivity()">
                                <div class="icon-circle" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">🔔</div>
                                <h4 style="margin: 1rem 0 0.5rem 0;">System Activity</h4>
                                <p class="subtext" style="font-size: 0.85rem;">Live feed of platform notifications, deal statuses, and user sign-ups.</p>
                            </div>
                            <div class="glass-card admin-module-card" onclick="app.showAdminAPIKeys()">
                                <div class="icon-circle" style="background: rgba(107, 114, 128, 0.1); color: var(--text-muted);">🔑</div>
                                <h4 style="margin: 1rem 0 0.5rem 0;">API & Secrets</h4>
                                <p class="subtext" style="font-size: 0.85rem;">Manage backend keys, Firestore limits, and third-party integration secrets.</p>
                            </div>
                        </div>
                    </div>
                ` : ''}

                    <div style="margin-top: 4rem; grid-column: 1 / -1; text-align: center; border-top: 1px solid var(--border); padding-top: 2rem;">
                        <p class="subtext" style="font-size: 0.8rem; margin-bottom: 1.5rem;">ProcFin Engine v12.66 &bull; Status: Operational</p>
                        <div style="display: flex; justify-content: center; gap: 1rem;">
                            <button class="btn btn-outline btn-sm" onclick="app.logout()" style="color: #ef4444; border-color: rgba(239,68,68,0.2);">Sign Out</button>
                            <button class="btn btn-outline btn-sm" onclick="if(confirm('This will reload the latest platform engine and clear temporary data. Proceed?')){ localStorage.clear(); sessionStorage.clear(); location.reload(true); }">Hard Refresh Engine</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
    },

    async submitFundingRequest(event) {
        event.preventDefault();
        const form = event.target;
        const amount = Number(form.querySelector('input[type="number"]').value);
        const category = form.querySelector('select').value;
        const desc = this.escapeHTML(form.querySelector('textarea').value);

        if (isNaN(amount) || amount <= 0) {
            alert("Error: Please enter a valid funding amount.");
            return;
        }

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="status pulse" style="background: rgba(255,255,255,0.2);">Submitting...</span>';
        btn.disabled = true;

        try {
            await addDoc(collection(db, "deals"), {
                smeId: this.user.id,
                smeName: this.user.name,
                amount: amount,
                category: category,
                description: desc,
                status: 'Pending Review',
                createdAt: new Date().toISOString()
            });

            // Notify the platform funder of a new deal on the platform
            await this.notifyAllFunders(`New Deal Alert: ${this.user.name} is looking for R${Number(amount).toLocaleString()} funding in ${category}.`);
            alert('Funding Request Submitted Successfully! The platform funder has been notified.');
            this.showDashboard();
        } catch (error) {
            console.error("Error submitting deal:", error);
            alert("Failed to submit request.");
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    async submitQuoteRequest(event) {
        event.preventDefault();
        const form = event.target;
        const title = form.querySelector('input[type="text"]').value;
        const category = form.querySelector('select').value;
        const specs = form.querySelector('textarea').value;
        const location = form.querySelectorAll('input[type="text"]')[1].value;
        const fileInput = form.querySelector('input[type="file"]');
        let fileUrl = null;

        const btn = form.querySelector('button[type="submit"]');
        btn.innerHTML = 'Broadcasting...';
        btn.disabled = true;

        try {
            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const storageRef = ref(storage, `rfq_docs/${this.user.id}_${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                fileUrl = await getDownloadURL(snapshot.ref);
            }

            await addDoc(collection(db, "rfqs"), {
                smeId: this.user.id,
                smeName: this.user.name,
                title: title,
                category: category,
                specs: specs,
                location: location,
                docUrl: fileUrl,
                status: 'Requested',
                quotes: [],
                createdAt: new Date().toISOString()
            });
            // Send ping to suppliers in this category
            await this.notifySupplierCategory(category, `New RFQ: ${title}`);

            alert('Quotation request securely broadcasted to Verified Suppliers!');
            this.showDashboard();
        } catch (error) {
            console.error("Error submitting RFQ:", error);
            alert("Failed to broadcast RFQ.");
            btn.innerHTML = 'Broadcast Request';
            btn.disabled = false;
        }
    },

    showProfileEdit() {
        this.setView(`
             <div class="hero-enter" style="max-width: 600px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back to Dashboard</button>
                <h2>Complete Your Profile</h2>
                <p class="subtext" style="margin-bottom: 2rem;">Fleshing out your profile ensures faster matching with funders and suppliers.</p>

                <div class="glass-card">
                    <form id="profileEditForm" onsubmit="event.preventDefault(); app.saveProfile();">
                        <div class="form-group">
                            <label>Company/Display Name</label>
                            <input type="text" id="profileName" class="form-control" value="${this.user.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Registration Number (CIPC)</label>
                            <input type="text" id="profileReg" class="form-control" value="${this.user.registrationNumber || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Industry / Sector (Select up to 5 by holding Cmd/Ctrl)</label>
                            <select id="profileIndustry" class="form-control" multiple size="5" required>
                                ${this.fundingCategories.map(c => `
                                    <option value="${c.name}" ${Array.isArray(this.user.industry) && this.user.industry.includes(c.name) ? 'selected' : (this.user.industry === c.name ? 'selected' : '')}>${c.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <p class="subtext" style="margin-bottom: 1rem;">Note: Compliance documents (CSD, Tax) should be uploaded via the Document Vault.</p>
                        <button type="submit" class="btn btn-primary btn-large" style="width: 100%; margin-top: 1rem;">Save Profile</button>
                    </form>
                </div>
             </div>
        `);
    },

    async saveProfile() {
        const name = document.getElementById('profileName').value;
        const reg = document.getElementById('profileReg').value;
        const industrySelect = document.getElementById('profileIndustry');
        const industry = Array.from(industrySelect.selectedOptions).map(o => o.value);

        if (industry.length > 5) {
            alert("Error: You can strictly select a maximum of 5 matching categories.");
            return;
        }
        if (industry.length === 0) {
            alert("Please select at least one category to receive matched RFQs.");
            return;
        }

        const btn = document.querySelector('#profileEditForm button');
        const ogText = btn.innerHTML;
        btn.innerHTML = '<span class="status pulse">Saving...</span>';
        btn.disabled = true;

        try {
            await setDoc(doc(db, "users", this.user.id), {
                name: name,
                registrationNumber: reg,
                industry: industry,
                profileCompleted: true
            }, { merge: true });

            this.user.name = name;
            this.user.registrationNumber = reg;
            this.user.industry = industry;
            this.user.profileCompleted = true;
            localStorage.setItem(STORE_KEY, JSON.stringify(this.user));

            alert('Profile saved securely!');
            this.showDashboard();
        } catch (error) {
            console.error("Profile save error:", error);
            alert("Failed to save profile.");
            btn.innerHTML = ogText;
            btn.disabled = false;
        }
    },

    showSubscriptionCheckout() {
        this.setView(`
            <div class="hero-enter" style="max-width: 500px; margin: 4rem auto;">
                <div class="glass-card" style="padding: 0; overflow: hidden; border: none; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
                    <div style="background: #10b981; color: white; padding: 2rem; text-align: center;">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 0.5rem;"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v2M3 13h18M5 17h14a2 2 0 0 0 2-2v-4H3v4a2 2 0 0 0 2 2z"/></svg>
                        <h2 style="font-family: var(--font-heading); margin-bottom: 0.5rem; color: white;">PayFast Secure</h2>
                        <p style="opacity: 0.9; font-size: 0.9rem;">ProcFin Supplier Subscription</p>
                        <h1 style="color: white; margin-top: 1rem; font-weight: 800; font-family: monospace;">ZAR 499.00</h1>
                    </div>
                    
                    <form id="payfast-mock-form" style="padding: 2rem; background: var(--card-bg);" onsubmit="event.preventDefault(); app.processPayment();">
                        <div class="form-group">
                            <label>Name on Card</label>
                            <input type="text" class="form-control" placeholder="John Doe" required>
                        </div>
                        <div class="form-group">
                            <label>Valid Card Number</label>
                            <input type="text" class="form-control" placeholder="4000 1234 5678 9010" required>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label>Expiry Date</label>
                                <input type="text" class="form-control" placeholder="MM/YY" required>
                            </div>
                            <div class="form-group">
                                <label>CVV / CVC</label>
                                <input type="password" class="form-control" placeholder="***" required>
                            </div>
                        </div>
                        <button type="submit" id="pay-btn" class="btn btn-primary btn-large" style="width: 100%; margin-top: 1.5rem; background: #10b981; border: none; font-size: 1.1rem; padding: 1rem;">Secure Pay R499.00</button>
                    </form>
                    
                    <div id="payment-success" style="display: none; padding: 4rem 2rem; text-align: center; background: var(--card-bg);">
                        <div style="background: rgba(16, 185, 129, 0.1); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <h3 style="margin-bottom: 0.5rem; color: var(--accent);">Payment Complete!</h3>
                        <p class="subtext">Your account is now fully verified. Redirecting to Live RFQs...</p>
                    </div>
                </div>
            </div>
        `);
    },

    async processPayment() {
        const btn = document.getElementById('pay-btn');
        btn.innerHTML = '<span class="status pulse" style="background: rgba(255,255,255,0.2); color: white;">Processing securely...</span>';
        btn.disabled = true;

        setTimeout(async () => {
            document.getElementById('payfast-mock-form').style.display = 'none';
            document.getElementById('payment-success').style.display = 'block';

            try {
                const userRef = doc(db, "users", this.user.id);
                await setDoc(userRef, { subscribed: true }, { merge: true });
                this.user.subscribed = true;
                localStorage.setItem(STORE_KEY, JSON.stringify(this.user));

                setTimeout(() => {
                    this.showDashboard();
                }, 2500);
            } catch (error) {
                console.error("Subscription activation failed", error);
                alert("Payment succeeded but database activation failed. Contact support.");
            }
        }, 1500);
    },

    showFundingRequest() {
        this.setView(`
    <div class="hero-enter" style = "max-width: 600px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back</button>
                <h2>Apply for Funding</h2>
                <p class="subtext" style="margin-bottom: 2rem;">Submit details to be matched with our verified funders.</p>

                <div class="glass-card">
                    <form onsubmit="app.submitFundingRequest(event)">
                        <div class="form-group">
                            <label>Funding Amount (ZAR)</label>
                            <input type="number" class="form-control" placeholder="e.g. 250000" required>
                        </div>
                        <div class="form-group">
                            <label>Funding Category</label>
                            <select class="form-control" required>
                                <option value="">Select Category...</option>
                                ${app.fundingCategories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Purpose of Funding (Brief Description)</label>
                            <textarea class="form-control" rows="4" required></textarea>
                        </div>
                         <div class="form-group">
                            <label>Upload Supporting Docs (PO, Invoices, Bank Statements)</label>
                            <input type="file" class="form-control" style="padding: 0.5rem;" multiple>
                        </div>
                        <button type="submit" class="btn btn-primary btn-large" style="width: 100%; margin-top: 1rem;">Submit Request</button>
                    </form>
                </div>
             </div>
    `);
    },

    showQuoteRequest() {
        this.setView(`
    <div class="hero-enter" style = "max-width: 600px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back</button>
                
                <span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--accent); border-color: rgba(16, 185, 129, 0.2);">Supplier Network</span>
                <h2 style="margin-top: 0.5rem;">Request a Quotation</h2>
                <p class="subtext" style="margin-bottom: 2rem;">Need materials or services to fulfill a tender? Your request will be sent to matched, verified suppliers on the platform.</p>

                <div class="glass-card">
                    <form onsubmit="app.submitQuoteRequest(event)">
                        <div class="form-group">
                            <label>What do you need?</label>
                            <input type="text" class="form-control" placeholder="e.g. 50 Dell Laptops, or 20 Tons Cement" required>
                        </div>
                        <div class="form-group">
                            <label>Supplier Category</label>
                            <select class="form-control" required>
                                <option value="">Select Category...</option>
                                ${app.fundingCategories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Detailed Specifications</label>
                            <textarea class="form-control" rows="4" placeholder="Mention specific grades, delivery timelines, etc." required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Delivery Location</label>
                            <input type="text" class="form-control" placeholder="City/Province" required>
                        </div>
                        <div class="form-group">
                            <label>Reference Document (Optional)</label>
                            <input type="file" id="rfqDoc" class="form-control" style="padding: 0.5rem;" accept=".pdf,.doc,.docx,.jpg,.png">
                            <small class="subtext" style="font-size: 0.8rem; display: block; margin-top: 0.3rem;">Upload specifications, BOQs, or plans (PDF/Docs).</small>
                        </div>
                        <button type="submit" class="btn btn-primary btn-large" style="width: 100%; margin-top: 1rem;">
                            Broadcast Request
                        </button>
                    </form>
                </div>
             </div>
    `);
    },
    showMilestones() {
        this.setView(`
    <div class="hero-enter" style = "max-width: 600px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back to Dashboard</button>
                
                <h2>Active Funding & Payments</h2>
                <p class="subtext" style="margin-bottom: 2rem;">ProcFin ensures security mapping. Your allocated funds go directly to the verified supplier as project milestones are met.</p>

                <div class="glass-card">
                    <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1rem;">
                        <div>
                            <h3 style="margin: 0;">Supply of 50 HP Laptops</h3>
                            <p class="subtext">Supplier: AfriTek Solutions (Verified ID: SA-9281)</p>
                            <p class="subtext">Funder: BlueCape Capital</p>
                        </div>
                        <span class="badge" style="background: rgba(59,130,246,0.1); color: var(--primary);">In Progress</span>
                    </div>

                    <div style="position: relative; padding-left: 1.5rem; margin-top: 1.5rem;">
                        <!-- Timeline Line -->
                        <div style="position: absolute; left: 6px; top: 8px; bottom: 8px; width: 2px; background: var(--secondary); z-index: 1;"></div>
                        
                        <!-- Milestone 1 -->
                        <div style="position: relative; margin-bottom: 2rem; z-index: 2;">
                            <div style="position: absolute; left: -24px; top: 4px; width: 14px; height: 14px; border-radius: 50%; background: var(--accent); border: 2px solid var(--bg-color);"></div>
                            <h4 style="margin: 0;">Milestone 1: Deposit Paid</h4>
                            <p class="subtext">30% upfront payment sent directly to Supplier.</p>
                        </div>

                        <!-- Milestone 2 -->
                        <div style="position: relative; margin-bottom: 2rem; z-index: 2;">
                            <div style="position: absolute; left: -24px; top: 4px; width: 14px; height: 14px; border-radius: 50%; background: var(--primary); border: 2px solid var(--bg-color); box-shadow: 0 0 0 4px rgba(59,130,246,0.2);"></div>
                            <h4 style="margin: 0;">Milestone 2: Dispatch Confirmation</h4>
                            <p class="subtext">Awaiting supplier to upload waybill / proof of dispatch. Funder will release next 40% chunk.</p>
                            <button class="btn btn-secondary btn-sm" style="margin-top: 0.5rem; padding: 0.3rem 0.6rem; font-size: 0.8rem;">Review Supplier Docs</button>
                        </div>

                        <!-- Milestone 3 -->
                        <div style="position: relative; z-index: 2;">
                            <div style="position: absolute; left: -24px; top: 4px; width: 14px; height: 14px; border-radius: 50%; background: var(--secondary-hover); border: 2px solid var(--bg-color);"></div>
                            <h4 style="margin: 0;">Milestone 3: Final Delivery Sign-off</h4>
                            <p class="subtext">You (SME) must sign off on delivery. Funder releases remaining 30% retention to supplier.</p>
                        </div>
                    </div>
                </div>
             </div>
    `);
    },

    showFunderOffer() {
        this.setView(`
    <div class="hero-enter" style = "max-width: 700px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back to Pipeline</button>
                
                <h2>Structure Deal: My Awesome SME</h2>
                <p class="subtext" style="margin-bottom: 2rem;">Draft the funding terms for this R250,000 IT Hardware Tender request. Once approved, the platform automatically generates a tripartite contract involving you, the SME, and the selected Verified Supplier.</p>

                <div class="glass-card">
                    <form id="funderDealForm" onsubmit="app.generateContract('${dealId}')">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                            <div class="form-group">
                                <label>Principal Amount (ZAR)</label>
                                <input type="number" class="form-control" value="250000" id="dealPrincipal" required>
                            </div>
                            <div class="form-group">
                                <label>Interest Rate (%)</label>
                                <input type="number" step="0.1" class="form-control" value="12.5" id="dealInterest" required>
                            </div>
                            <div class="form-group">
                                <label>Platform/Origination Fee (ZAR)</label>
                                <input type="number" class="form-control" value="4500" id="dealFees" required>
                            </div>
                            <div class="form-group">
                                <label>Repayment Term</label>
                                <select class="form-control" id="dealTerm" required>
                                    <option value="Net 30 Days (Tender Payout)">Net 30 Days (Tender Payout)</option>
                                    <option value="Net 60 Days">Net 60 Days</option>
                                    <option value="Net 90 Days">Net 90 Days</option>
                                    <option value="6 Months Amortized">6 Months Amortized</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group" style="margin-top: 1rem;">
                            <label>Link to Verified Supplier (Currently Hardcoded Example)</label>
                            <select class="form-control" id="dealSupplier" required>
                                <option value="Tech Innovators (Pty) Ltd">Tech Innovators (Pty) Ltd - R${Number(deal.amount).toLocaleString()} Quote</option>
                                <option value="BuildItRight Construction">BuildItRight Construction</option>
                            </select>
                        </div>

                        <div class="form-group" style="margin-top: 1rem;">
                            <label>Default Terms & Conditions Appendage</label>
                            <div style="padding: 1rem; border: 1px solid var(--border); background: var(--secondary); border-radius: 8px; font-size: 0.85rem; height: 100px; overflow-y: auto;">
                                1. ProcFin acts as the escrow layer. <br>
                                2. Upon execution, Funder pays 30% upfront to the Supplier.<br>
                                3. Funder pays 40% upon Waybill completion.<br>
                                4. Funder pays 30% upon final delivery sign-off by the SME.<br>
                                5. SME cedes the government/corporate tender invoice payment directly into the designated ProcFin joint-account until the facility is settled.
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary btn-large" style="width: 100%; margin-top: 1rem;">
                            Generate Binding Smart Contract
                        </button>
                    </form>
                </div>
             </div>
        `);
    },

    async generateContract(dealId) {
        // Collect mock data from form
        const deal = this.deals.find(d => d.id === dealId) || { amount: 250000, smeName: 'My Awesome SME (Pty) Ltd' };
        const principal = document.getElementById('dealPrincipal').value || deal.amount;
        const interest = document.getElementById('dealInterest').value || 12.5;
        const fees = document.getElementById('dealFees').value || 4500;
        const term = document.getElementById('dealTerm').value || "Net 30 Days";
        const supplierSelect = document.getElementById('dealSupplier');
        const supplierName = supplierSelect.options[supplierSelect.selectedIndex].text;

        // Calculate total 
        const total = parseFloat(principal) + (parseFloat(principal) * (parseFloat(interest) / 100)) + parseFloat(fees);

        const btn = document.querySelector('#funderDealForm button[type="submit"]');
        const ogText = btn.innerHTML;
        btn.innerHTML = '<span class="status pulse">Generating Smart Contract...</span>';
        btn.disabled = true;

        try {
            if (deal.id) {
                // Lock the deal and deploy capital virtually
                await setDoc(doc(db, "deals", deal.id), {
                    status: 'Capital Secured',
                    funderId: this.user.id,
                    funderName: this.user.name,
                    supplierName: supplierSelect.value, // Used value for simplicity
                    dealTerms: { principal, interest, fees, total, term }
                }, { merge: true });

                // Ping the SME
                const smeDoc = await getDoc(doc(db, "users", deal.smeId));
                if (smeDoc.exists()) {
                    const smeEmail = smeDoc.data().email;
                    await this.sendNotification(deal.smeId, smeEmail, `🎉 Deal APPROVED! ${this.user.name} has secured R${Number(principal).toLocaleString()} in ProcFin escrow for your contract.`);
                }
            }

            this.setView(`
             <div class="hero-enter" style="max-width: 800px; margin: 2rem auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2>Contract Generated Successfully</h2>
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn btn-primary" onclick="window.downloadContractPDF()">Download Official PDF</button>
                        <button class="btn btn-secondary" onclick="app.showDashboard()">Return to Dashboard</button>
                    </div>
                </div>

                <div id="procfin-contract-doc" class="glass-card" style="background: white; color: black; border-radius: 4px; border-left: 8px solid var(--primary); padding: 3rem;">
                    
                    <div style="text-align: center; margin-bottom: 3rem;">
                        <h1 style="font-family: serif; color: black; font-size: 2rem;">Funding Facility Agreement</h1>
                        <p style="color: #666; margin-top: 0.5rem;">Auto-generated via ProcFin Engine on ${new Date().toLocaleDateString()}</p>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 3rem; font-family: serif;">
                        <div>
                            <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #666;">The Funder</strong>
                            <span style="font-size: 1.1rem;">${this.user.name}</span>
                        </div>
                        <div>
                            <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #666;">The SME (Borrower)</strong>
                            <span style="font-size: 1.1rem;">My Awesome SME (Pty) Ltd</span>
                        </div>
                        <div>
                            <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #666;">The Designated Supplier</strong>
                            <span style="font-size: 1.1rem;">${supplier}</span>
                        </div>
                    </div>

                    <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 2rem;">

                    <h3 style="font-family: serif; font-size: 1.2rem; margin-bottom: 1rem;">1. Financial Terms</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem; font-family: monospace; font-size: 0.95rem;">
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 0.8rem 0;">Principal Facility Amount</td>
                            <td style="text-align: right; font-weight: bold;">R ${Number(principal).toLocaleString()}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 0.8rem 0;">Interest Rate Applied</td>
                            <td style="text-align: right;">${interest}%</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 0.8rem 0;">Origination Fees</td>
                            <td style="text-align: right;">R ${Number(fees).toLocaleString()}</td>
                        </tr>
                        <tr style="border-bottom: 2px solid #000; background: #fafafa;">
                            <td style="padding: 1rem 0; font-weight: bold;">Total Repayment Due (${term})</td>
                            <td style="text-align: right; font-weight: bold; font-size: 1.1rem;">R ${total.toLocaleString()}</td>
                        </tr>
                    </table>

                    <h3 style="font-family: serif; font-size: 1.2rem; margin-bottom: 1rem;">2. Disbursement & Supplier Cession</h3>
                    <p style="font-family: serif; line-height: 1.6; color: #333; margin-bottom: 2rem;">
                        The Funder agrees to deploy the Principal Facility directly to the Designated Supplier (${supplierName}) across platform-managed milestones (30% Upfront, 40% Waybill, 30% Delivery). The SME cedes all rights to the initial tender invoice payout to the Funder until the Total Repayment Due is settled in full.
                    </p>

                    <div style="background: rgba(59, 130, 246, 0.05); padding: 1.5rem; text-align: center; border: 1px dashed var(--primary);">
                        <p style="font-weight: 500; margin-bottom: 1rem; color: var(--primary);">Currently Pending SME Electronic Signature</p>
                        <button class="btn btn-outline" disabled style="background: white;">Awaiting SME Acceptance</button>
                    </div>

                </div>
                </div>
             </div>
`);

            window.downloadContractPDF = () => {
                const element = document.getElementById('procfin-contract-doc');
                const opt = {
                    margin: [0.5, 0.5, 0.5, 0.5],
                    filename: 'ProcFin_Pesa_Contract.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                };
                html2pdf().set(opt).from(element).save();
            };

        } catch (error) {
            console.error("Error generating contract:", error);
            alert("Failed to secure capital and generate contract.");
            btn.innerHTML = ogText;
            btn.disabled = false;
        }
    },

    showSubmitQuote(rfqId) {
        const rfq = this.rfqs.find(r => r.id === rfqId);
        if (!rfq) return alert("RFQ not found!");

        this.setView(`
    <div class="hero-enter" style = "max-width: 600px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back</button>
                
                <span class="badge" style="background: rgba(59, 130, 246, 0.1); color: var(--primary); border-color: rgba(59, 130, 246, 0.2);">Quote Request</span>
                <h2 style="margin-top: 0.5rem;">${rfq.title}</h2>
                <p class="subtext" style="margin-bottom: 2rem;">Requested by ${rfq.smeName}. Delivery to ${rfq.location}. ${rfq.specs}</p>

                <div class="glass-card">
                    <form onsubmit="app.submitQuote(event, '${rfq.id}')">
                        <div class="form-group">
                            <label>Total Supply Cost (ZAR)</label>
                            <input type="number" class="form-control" placeholder="e.g. 250000" required>
                        </div>
                        <div class="form-group">
                            <label>Estimated Delivery Time</label>
                            <select class="form-control" required>
                                <option value="">Select Timeline...</option>
                                <option>1 - 3 Days</option>
                                <option>3 - 7 Days</option>
                                <option>1 - 2 Weeks</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Quote Proposal Details</label>
                            <textarea class="form-control" rows="4" placeholder="Mention exact specs being quoted, warranty info, etc." required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Upload Official Quote (PDF)</label>
                            <input type="file" class="form-control" style="padding: 0.5rem;" accept=".pdf">
                        </div>
                        <button type="submit" class="btn btn-primary btn-large" style="width: 100%; margin-top: 1rem;">
                            Submit Formal Quote
                        </button>
                    </form>
                </div>
             </div>
    `);
    },

    async submitQuote(event, rfqId) {
        event.preventDefault();
        const form = event.target;
        const price = Number(form.querySelectorAll('input')[0].value);
        const timeframe = form.querySelector('select').value;
        const terms = this.escapeHTML(form.querySelector('textarea').value);

        if (isNaN(price) || price <= 0) {
            alert("Error: Please enter a correct, positive price for the quote.");
            return;
        }

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="status pulse">Submitting...</span>';
        btn.disabled = true;

        try {
            const rfq = this.rfqs.find(r => r.id === rfqId);
            if (!rfq) throw new Error("RFQ not found");

            const quotes = rfq.quotes || [];
            quotes.push({
                supplierId: this.user.id,
                supplierName: this.user.name,
                price: price,
                timeframe: timeframe,
                terms: terms,
                submittedAt: new Date().toISOString()
            });

            await setDoc(doc(db, "rfqs", rfqId), { quotes }, { merge: true });

            // Ping the SME that they received a quote
            const smeDoc = await getDoc(doc(db, "users", rfq.smeId));
            if (smeDoc.exists()) {
                const smeEmail = smeDoc.data().email;
                await this.sendNotification(rfq.smeId, smeEmail, `You received a new quote of R${Number(price).toLocaleString()} from ${this.user.name} on your RFQ: ${rfq.title}`);
            }

            alert('Your formal quote was securely submitted to the SME!');
            this.showDashboard();
        } catch (error) {
            console.error("Error submitting quote:", error);
            alert("Failed to submit quote.");
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    showSupplierMilestones(dealId) {
        const deal = this.deals.find(d => d.id === dealId) || { category: '20T Cement', smeName: 'SME', funderName: 'Funder', amount: 0, status: 'Capital Secured' };
        const upfront = deal.amount * 0.30;
        const nextPayout = deal.amount * 0.40;

        window.handleWaybillUpload = async (fileInput) => {
            const file = fileInput.files[0];
            if (!file) return;

            const btn = document.getElementById('waybillBtn');
            btn.innerHTML = '<span class="status pulse">Uploading...</span>';
            btn.disabled = true;

            try {
                // Upload to Storage
                const storageRef = ref(storage, `waybills / ${deal.id}_${file.name} `);
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);

                // Update Deal status
                await setDoc(doc(db, "deals", deal.id), {
                    status: 'Delivery Confirmed',
                    waybillUrl: downloadURL
                }, { merge: true });

                alert('Waybill uploaded! Escrow has automatically disbursed the next payment.');
                this.showDashboard();
            } catch (e) { console.error(e); alert('Upload failed'); btn.disabled = false; btn.innerHTML = 'Upload Waybill'; }
        }

        this.setView(`
    <div class="hero-enter" style = "max-width: 600px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back to Dashboard</button>
                
                <h2>Active Contract: ${deal.category}</h2>
                <p class="subtext" style="margin-bottom: 2rem;">Upload your proof of dispatch to unlock the next 40% milestone payment directly from the Funder's escrow layer.</p>

                <div class="glass-card">
                    <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1rem;">
                        <div>
                            <h3 style="margin: 0;">Contract Execution</h3>
                            <p class="subtext">SME: ${deal.smeName}</p>
                            <p class="subtext">Funder: ${deal.funderName}</p>
                        </div>
                        <span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--accent);">${deal.status === 'Delivery Confirmed' ? '100% Paid' : '30% Upfront Paid'}</span>
                    </div>

                    <div style="position: relative; padding-left: 1.5rem; margin-top: 1.5rem;">
                        <div style="position: absolute; left: 6px; top: 8px; bottom: 8px; width: 2px; background: var(--secondary); z-index: 1;"></div>
                        
                        <div style="position: relative; margin-bottom: 2rem; z-index: 2;">
                            <div style="position: absolute; left: -24px; top: 4px; width: 14px; height: 14px; border-radius: 50%; background: var(--accent); border: 2px solid var(--bg-color);"></div>
                            <h4 style="margin: 0;">Milestone 1: Deposit (Completed)</h4>
                            <p class="subtext">30% upfront payment (R${upfront.toLocaleString()}) received.</p>
                        </div>

                        <div style="position: relative; margin-bottom: 2rem; z-index: 2;">
                            <div style="position: absolute; left: -24px; top: 4px; width: 14px; height: 14px; border-radius: 50%; ${deal.status === 'Delivery Confirmed' ? 'background: var(--accent);' : 'background: var(--primary); box-shadow: 0 0 0 4px rgba(59,130,246,0.2);'} border: 2px solid var(--bg-color);"></div>
                            <h4 style="margin: 0;">Milestone 2: Dispatch Confirmation</h4>
                            ${deal.status === 'Delivery Confirmed' ?
                `<p class="subtext" style="color: var(--accent); font-weight: bold;">Waybill Confirmed! R${nextPayout.toLocaleString()} released from Escrow.</p>
                                 <a href="${deal.waybillUrl}" target="_blank" class="btn btn-outline btn-sm">View Waybill</a>` :
                `<p class="subtext">Upload proof of dispatch/waybill to request the next 40% chunk (R${nextPayout.toLocaleString()}).</p>
                                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-color); border-radius: 8px; border: 1px dashed var(--border);">
                                    <input type="file" id="waybillInput" class="form-control" style="padding: 0.5rem; margin-bottom: 0.5rem;" accept=".pdf,.jpg,.png">
                                    <button id="waybillBtn" class="btn btn-primary btn-sm" onclick="window.handleWaybillUpload(document.getElementById('waybillInput'))">Upload Waybill</button>
                                </div>`
            }
                        </div>
                    </div>
                </div>
             </div>
    `);
    },

    showFunderDocReview() {
        const smeDocs = this.docTypes.filter(d => d.requiredFor.includes('SME'));

        const renderSmeDocs = () => {
            if (smeDocs.length === 0) return '<p class="subtext">No documents required for this SME.</p>';
            return smeDocs.map(doc => `
    <div style="background: var(--bg-color); border: 1px solid var(--border); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="display: block; margin-bottom: 0.2rem;">${doc.name}</strong>
                        <span class="subtext" style="font-size: 0.85rem;">Uploaded on 12 Oct 2026</span>
                    </div>
                    <div>
                        <button class="btn btn-outline btn-sm" onclick="alert('Downloading ${doc.name} (Simulated)...')">View File</button>
                    </div>
                </div>
    `).join('');
        };

        this.setView(`
    <div class="hero-enter" style = "max-width: 700px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back to Pipeline</button>
                
                <h2>Review Documents: My Awesome SME</h2>
                <p class="subtext" style="margin-bottom: 2rem;">As a funder, verify the SME's identity, tax status, and affordability before structuring a deal.</p>

                <div class="glass-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
                        <h3 style="margin: 0;">SME Vault Contents</h3>
                        <span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--accent);">Complete</span>
                    </div>

                    ${renderSmeDocs()}

                    <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                        <button class="btn btn-outline" style="flex: 1;" onclick="alert('Declining SME application.'); app.showDashboard();">Decline Application</button>
                        <button class="btn btn-primary" style="flex: 1;" onclick="app.showFunderOffer()">Approve & Structure Deal</button>
                    </div>
                </div>
             </div>
    `);
    },

    async approveQuote(rfqId, supplierId, customComment = "") {
        if (!confirm("Are you sure you want to approve this quote? This will close the RFQ.")) return;
        try {
            const rfqRef = doc(db, "rfqs", rfqId);
            const rfqDoc = await getDoc(rfqRef);
            if (!rfqDoc.exists()) return;
            const rfqData = rfqDoc.data();

            const selectedQuote = rfqData.quotes.find(q => q.supplierId === supplierId);

            await setDoc(rfqRef, {
                status: 'Closed (Quote Accepted)',
                acceptedQuote: selectedQuote
            }, { merge: true });

            // Send notification to supplier
            const supplierDoc = await getDoc(doc(db, "users", supplierId));
            if (supplierDoc.exists()) {
                const supplierEmail = supplierDoc.data().email;
                await this.sendNotification(supplierId, supplierEmail, `🎉 QUOTE ACCEPTED: ${this.user.name} approved your quote for ${rfqData.title}! The SME will now secure funding. ${customComment ? `\n\nNotes: ${customComment}` : ''}`);
            }

            alert("Quote Approved!");
            this.showDashboard();
        } catch (error) {
            console.error("Error approving quote:", error);
            alert("Failed to approve quote.");
        }
    },

    async rejectQuote(rfqId, supplierId) {
        if (!confirm("Are you sure you want to reject this quote?")) return;
        try {
            const rfqRef = doc(db, "rfqs", rfqId);
            const rfqDoc = await getDoc(rfqRef);
            if (!rfqDoc.exists()) return;
            let rfqData = rfqDoc.data();

            // Mark the specific quote as 'rejected'
            const updatedQuotes = rfqData.quotes.map(q => {
                if (q.supplierId === supplierId) {
                    q.rejected = true;
                }
                return q;
            });

            await setDoc(rfqRef, { quotes: updatedQuotes }, { merge: true });

            // Send notification to supplier
            const supplierDoc = await getDoc(doc(db, "users", supplierId));
            if (supplierDoc.exists()) {
                const supplierEmail = supplierDoc.data().email;
                await this.sendNotification(supplierId, supplierEmail, `⚠️ QUOTE REJECTED: Your quote for ${rfqData.title} was not accepted by the SME.`);
            }
            alert("Quote Rejected.");
            this.showReviewQuotes(rfqId);
        } catch (error) {
            console.error(error);
            alert("Error rejecting quote.");
        }
    },

    showReviewQuotes(rfqId) {
        const rfq = this.rfqs.find(r => r.id === rfqId);
        if (!rfq) return this.showDashboard();

        this.setView(`
            <div class="hero-enter" style="max-width: 800px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back to Dashboard</button>
                <h2>Review Quotes submitted for: ${rfq.title}</h2>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
                    <p class="subtext" style="max-width: 60%">Specs: ${rfq.specs}</p>
                    <span class="badge" style="background: rgba(16,185,129,0.1); color: var(--accent);">${rfq.status}</span>
                </div>

                <div style="display: grid; gap: 1.5rem;">
                    ${rfq.quotes && rfq.quotes.length > 0 ? rfq.quotes.map((q, idx) => `
                        <div class="glass-card" style="opacity: ${q.rejected ? '0.5' : '1'}; border-left: 4px solid ${q.rejected ? '#ef4444' : (rfq.acceptedQuote && rfq.acceptedQuote.supplierId === q.supplierId ? 'var(--accent)' : 'var(--primary)')};">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                                <div>
                                    <h3 style="margin: 0; color: var(--text-color);">R${Number(q.amount).toLocaleString()}</h3>
                                    <span class="subtext" style="font-size: 0.85rem; font-weight: 600;">Supplier: ${q.supplierName}</span>
                                </div>
                                ${q.rejected ? '<span class="status" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">Rejected</span>' : (rfq.acceptedQuote && rfq.acceptedQuote.supplierId === q.supplierId ? '<span class="status pulse">Accepted Offer</span>' : '')}
                            </div>

                            <p style="font-size: 0.95rem; margin-bottom: 1.5rem; background: var(--secondary); padding: 1rem; border-radius: 4px;">"${q.message}"</p>
                            
                            ${rfq.status !== 'Closed (Quote Accepted)' && !q.rejected ? `
                                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                                    <textarea id="comment_${q.supplierId}" class="form-control" style="flex: 2; min-height: 40px;" placeholder="Optional comments to send on approval..."></textarea>
                                    <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
                                        <button class="btn btn-primary" onclick="app.approveQuote('${rfq.id}', '${q.supplierId}', document.getElementById('comment_${q.supplierId}').value)">Accept Quote</button>
                                        <button class="btn btn-outline" style="color: #ef4444; border-color: rgba(239,68,68,0.3);" onclick="app.rejectQuote('${rfq.id}', '${q.supplierId}')">Reject</button>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `).join('') : '<p class="subtext">No quotes submitted yet.</p>'}
                </div>
            </div>
        `);
    },

    showAdminDashboard() {
        const renderDocTypes = () => {
            return this.docTypes.map(doc => `
                <div style="background: var(--bg-color); border: 1px solid var(--border); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0; margin-bottom: 0.2rem;">${doc.name}</h4>
                        <p class="subtext" style="margin: 0;">${doc.description}</p>
                        <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                            ${doc.requiredFor.map(role => `<span class="badge" style="background: rgba(59, 130, 246, 0.1); color: var(--primary); padding: 0.2rem 0.4rem; font-size: 0.7rem;">For ${role}</span>`).join('')}
                        </div>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="app.docTypes = app.docTypes.filter(d => d.id !== ${doc.id}); app.saveDocTypes(); app.showAdminDashboard();">Remove</button>
                </div>
            `).join('');
        };

        this.setView(`
            <div class="hero-enter" style="max-width: 800px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back to Admin Panel</button>
                
                <h2>Compliance Document Types</h2>
                <p class="subtext" style="margin-bottom: 2rem;">Manage the mandatory documents that SMEs and Suppliers must upload to get verified on the platform.</p>

                <div style="display: grid; grid-template-columns: 1fr 300px; gap: 2rem;">
                    <div>
                        <h3>Current Requirements</h3>
                        ${renderDocTypes()}
                    </div>
                    
                    <div>
                        <div class="glass-card" style="position: sticky; top: 100px;">
                            <h3>Add New Document Type</h3>
                            <form onsubmit="event.preventDefault(); app.addDocType(this);">
                                <div class="form-group">
                                    <label>Document Name</label>
                                    <input type="text" name="name" class="form-control" required placeholder="e.g. B-BBEE Certificate">
                                </div>
                                <div class="form-group">
                                    <label>Description</label>
                                    <textarea name="desc" class="form-control" rows="2" required placeholder="Explain why it's needed"></textarea>
                                </div>
                                <div class="form-group">
                                    <label>Required For</label>
                                    <div style="display: flex; gap: 1rem; align-items: center; margin-top: 0.5rem;">
                                        <label style="display: flex; align-items: center; gap: 0.3rem;"><input type="checkbox" name="req_sme" value="SME" checked> SME</label>
                                        <label style="display: flex; align-items: center; gap: 0.3rem;"><input type="checkbox" name="req_sup" value="SUPPLIER"> Supplier</label>
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Add Requirement</button>
                            </form>
                        </div>
                </div>
            </div>
        `);
    },

    addDocType(form) {
        const name = form.name.value;
        const desc = form.desc.value;
        const requiredFor = [];
        if (form.req_sme.checked) requiredFor.push('SME');
        if (form.req_sup.checked) requiredFor.push('SUPPLIER');

        if (requiredFor.length === 0) {
            alert("Please select at least one role role (SME or Supplier).");
            return;
        }

        const newId = this.docTypes.length ? Math.max(...this.docTypes.map(d => d.id)) + 1 : 1;
        this.docTypes.push({ id: newId, name, description: desc, requiredFor });
        this.saveDocTypes();
        this.showAdminDashboard();
    },

    showAdminCategories() {
        const renderCategories = () => {
            return this.fundingCategories.map(cat => `
                <div style="background: var(--bg-color); border: 1px solid var(--border); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0; margin-bottom: 0.2rem;">${cat.name}</h4>
                        <p class="subtext" style="margin: 0;">${cat.description}</p>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="app.fundingCategories = app.fundingCategories.filter(c => c.id !== ${cat.id}); app.saveFundingCategories(); app.showAdminCategories();">Remove</button>
                </div>
            `).join('');
        };

        this.setView(`
            <div class="hero-enter" style="max-width: 800px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back to Admin Panel</button>
                
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2>Funding Categories</h2>
                        <p class="subtext" style="margin-bottom: 2rem;">Manage the funding options that SMEs can apply for.</p>
                    </div>
                    <button class="btn btn-outline" style="border-color: var(--accent); color: var(--accent);" onclick="app.loadOfficialCategories()">Load Official SA Tender Categories</button>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 300px; gap: 2rem;">
                    <div>
                        <h3>Current Categories</h3>
                        ${renderCategories()}
                    </div>
                    
                    <div>
                        <div class="glass-card" style="position: sticky; top: 100px;">
                            <h3>Add New Category</h3>
                            <form onsubmit="event.preventDefault(); app.addFundingCategory(this);">
                                <div class="form-group">
                                    <label>Category Name</label>
                                    <input type="text" name="name" class="form-control" required placeholder="e.g. Invoice Factoring">
                                </div>
                                <div class="form-group">
                                    <label>Brief Description</label>
                                    <textarea name="desc" class="form-control" rows="2" required placeholder="Unlocking cash from unpaid invoices"></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Add Category</button>
                            </form>
                        </div>
                </div>
            </div>
        `);
    },

    loadOfficialCategories() {
        if (!confirm("Are you sure? This will replace all current categories with the official scraped Tender categories!")) return;
        this.fundingCategories = [
            { id: 1, name: 'Construction & Civil Works', description: 'General construction, civil engineering, electrical' },
            { id: 2, name: 'Media Production & PR', description: 'Video, audio production, marketing, and public relations' },
            { id: 3, name: 'Software & IT Development', description: 'App development, networking, bespoke software' },
            { id: 4, name: 'Logistics & Supply Chain', description: 'Transport, warehousing, distribution' },
            { id: 5, name: 'Cleaning & Facilities Management', description: 'Janitorial, security, pest control' },
            { id: 6, name: 'Consulting & Professional Services', description: 'Accounting, legal, management consulting' },
            { id: 7, name: 'Medical & Healthcare Products', description: 'Equipment, generic pharmaceuticals, social services' },
            { id: 8, name: 'Catering & Event Management', description: 'Food services, corporate events, equipment hire' },
            { id: 9, name: 'Agriculture & Agri-processing', description: 'Farming, milling, food packaging' },
            { id: 10, name: 'General Supply & Retail', description: 'Stationery, office supplies, protective clothing' }
        ];
        this.saveFundingCategories();
        this.showAdminCategories();
        alert("Official platform matching categories loaded successfully!");
    },

    addFundingCategory(form) {
        const name = form.name.value;
        const desc = form.desc.value;
        const newId = this.fundingCategories.length ? Math.max(...this.fundingCategories.map(c => c.id)) + 1 : 1;

        this.fundingCategories.push({ id: newId, name, description: desc });
        this.saveFundingCategories();
        this.showAdminCategories();
    },

    async showDocumentRepo() {
        const userType = this.user.type; // 'SME' or 'SUPPLIER'
        const requiredDocs = this.docTypes.filter(doc => doc.requiredFor.includes(userType));

        let existingDocs = {};
        try {
            const docsSnap = await getDocs(collection(db, "user_documents"));
            docsSnap.forEach(d => {
                const data = d.data();
                if (data.uid === this.user.id) {
                    existingDocs[data.docTypeId] = data;
                }
            });
        } catch (e) {
            console.error("Error fetching docs", e);
        }

        const uploadedCount = requiredDocs.filter(d => existingDocs[d.id]).length;
        const totalCount = requiredDocs.length;
        const progressPercent = totalCount > 0 ? Math.round((uploadedCount / totalCount) * 100) : 100;

        window.handleCloudUpload = async (docId, fileInput) => {
            const file = fileInput.files[0];
            if (!file) return;

            const btnContainer = fileInput.parentElement;
            btnContainer.innerHTML = '<span class="status pulse" style="background: rgba(59, 130, 246, 0.1); color: var(--primary);">Uploading...</span>';

            try {
                // Upload to Storage with Timestamp to prevent overwriting
                const timestamp = Date.now();
                const filePath = `userData/${this.user.id}/documents/${docId}_${timestamp}_${file.name}`;
                const storageRef = ref(storage, filePath);
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);

                // Save reference link to DB
                await setDoc(doc(db, "user_documents", `${this.user.id}_${docId}`), {
                    uid: this.user.id,
                    docTypeId: docId,
                    url: downloadURL,
                    storagePath: filePath,
                    uploadedAt: new Date().toISOString()
                });

                app.showDocumentRepo();
            } catch (error) {
                console.error("Upload failed", error);
                btnContainer.innerHTML = '<span class="status pulse" style="background: rgba(220, 38, 38, 0.1); color: #dc2626;">Upload Failed</span>';
            }
        };

        window.handleCloudDelete = async (docId, filePath, btnElement) => {
            const originalHTML = btnElement.parentElement.innerHTML;
            btnElement.parentElement.innerHTML = '<span class="status pulse" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">Deleting...</span>';

            try {
                // Delete from Storage
                const storageRef = ref(storage, filePath);
                await deleteObject(storageRef);

                // Delete from Firestore
                await deleteDoc(doc(db, "user_documents", `${this.user.id}_${docId}`));

                app.showDocumentRepo();
            } catch (error) {
                console.error("Delete failed", error);
                alert("Failed to delete document.");
                btnElement.parentElement.innerHTML = originalHTML;
            }
        };

        const renderDocs = () => {
            if (requiredDocs.length === 0) {
                return `<p class="subtext">No compliance documents are required currently.</p>`;
            }

            return requiredDocs.map(docType => {
                const upDoc = existingDocs[docType.id];
                const actionHtml = upDoc
                    ? `<div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                          <a href="${upDoc.url}" target="_blank" class="btn btn-outline btn-sm">View</a>
                          <button class="btn btn-secondary btn-sm" onclick="window.handleCloudDelete('${docType.id}', '${upDoc.storagePath}', this)">Delete</button>
                       </div>`
                    : `<div>
                          <input type="file" id="file-${docType.id}" style="display: none;" onchange="window.handleCloudUpload(${docType.id}, this);">
                          <button class="btn btn-primary btn-sm" onclick="document.getElementById('file-${docType.id}').click();">Upload File</button>
                       </div>`;

                return `<div style="background: var(--bg-color); border: 1px solid var(--border); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="display: block; margin-bottom: 0.2rem; color: ${upDoc ? 'var(--text-color)' : 'var(--text-muted)'};">${docType.name}</strong>
                        <span class="subtext" style="font-size: 0.85rem;">${docType.description}</span>
                    </div>
                    <div style="text-align: right;">
                        ${actionHtml}
                    </div>
                </div>`;
            }).join('');
        };

        this.setView(`
    <div class="hero-enter" style = "max-width: 600px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back to Dashboard</button>
                
                <h2>Secure Document Vault</h2>
                <p class="subtext" style="margin-bottom: 2rem;">Upload your required compliance documents here. These are stored securely via ProcFin and are shared with Funders structured in your active deals.</p>

                <div class="glass-card">
                    <div style="margin-bottom: 2rem;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.5rem;">
                            <h3 style="margin: 0; font-size: 1rem;">Setup Progress</h3>
                            <span style="font-weight: bold; color: var(--primary);">${progressPercent}%</span>
                        </div>
                        <div style="width: 100%; background: var(--border); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="width: ${progressPercent}%; background: var(--primary); height: 100%; transition: width 0.3s ease;"></div>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
                        <h3 style="margin: 0;">Required Documents</h3>
                        <span class="badge" style="background: ${progressPercent === 100 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; color: ${progressPercent === 100 ? 'var(--accent)' : '#f59e0b'};">${progressPercent === 100 ? 'Complete' : 'Verification Pending'}</span>
                    </div>

                    ${renderDocs()}
                    
                    <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(59, 130, 246, 0.05); border: 1px dashed var(--primary); border-radius: 8px; text-align: center;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" style="margin-bottom: 0.5rem;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        <h4 style="margin-bottom: 0.5rem;">Bank-grade Encryption</h4>
                        <p class="subtext" style="font-size: 0.85rem;">Your uploaded files are encrypted at rest using AES-256 and stored securely via Google Cloud Storage.</p>
                    </div>
                </div>
             </div>
    `);
    },

    showNotifications() {
        // Mark all as read when opening
        this.notifications.forEach(n => n.read = true);
        this.saveNotifications();
        this.renderNavbar(); // Update bell icon

        const renderNotifs = () => {
            if (this.notifications.length === 0) return '<p class="subtext" style="text-align: center; padding: 2rem;">No new notifications</p>';

            return this.notifications.map(n => `
    <div style="padding: 1rem; border-bottom: 1px solid var(--border); display: flex; gap: 1rem; align-items: start;">
                    <div style="background: rgba(59, 130, 246, 0.1); color: var(--primary); border-radius: 50%; padding: 0.5rem; display: flex; align-items: center; justify-content: center;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </div>
                    <div style="flex: 1;">
                        <p style="margin: 0; font-size: 0.95rem; color: var(--text-color);">${n.text}</p>
                        <span class="subtext" style="font-size: 0.8rem; display: block; margin-top: 0.2rem;">${n.time}</span>
                    </div>
                </div>
    `).join('');
        };

        this.setView(`
    <div class="hero-enter" style = "max-width: 600px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back to Dashboard</button>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0;">Inbox & Alerts</h2>
                    <button class="btn btn-outline btn-sm" onclick="app.notifications = []; app.saveNotifications(); app.showNotifications();">Clear All</button>
                </div>

                <div class="glass-card" style="padding: 0;">
                    ${renderNotifs()}
                </div>
             </div>
    `);
    },

    showHowItWorks() {
        this.setView(`
    <div class="hero-enter" style = "max-width: 800px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.renderHome()">&larr; Home</button>
                <h2>How ProcFin Works</h2>
                <p class="subtext" style="margin-bottom: 2rem;">A seamless ecosystem empowering SMEs, connecting Funders, and managing Verified Suppliers built on escrow security.</p>
                
                <div style="display: grid; gap: 1.5rem; grid-template-columns: 1fr;">
                    <div class="glass-card">
                        <h3 style="color: var(--primary);">1. Apply & Verify</h3>
                        <p class="subtext">SMEs sign up and upload compliance documents (CSD, Tax PIN, etc.) to the secure Document Vault. Verified Suppliers subscribe to access the national database of RFQs.</p>
                    </div>
                    <div class="glass-card">
                        <h3 style="color: var(--accent);">2. Get Matched</h3>
                        <p class="subtext">Funders review verified SMEs within their mandate and structure capital deals. SMEs leverage the platform to request RFQs directly from Verified Suppliers.</p>
                    </div>
                    <div class="glass-card">
                        <h3 style="color: #f59e0b;">3. Milestone Payments & Escrow</h3>
                        <p class="subtext">Capital is locked into ProcFin escrow. Instead of cash hitting the SME's account, ProcFin directly pays the Verified Supplier upon proof of dispatch/waybill upload, neutralizing fund mismanagement.</p>
                    </div>
                </div>
            </div>
    `);
    },

    showFundingCategories() {
        this.setView(`
    <div class="hero-enter" style = "max-width: 800px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.renderHome()">&larr; Home</button>
                <h2>Funding Categories</h2>
                <p class="subtext" style="margin-bottom: 2rem;">Explore the capital structures and mandates available on the ProcFin platform.</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                    <div class="glass-card" style="background: var(--bg-color);">
                        <h3>Tender/PO Funding</h3>
                        <p class="subtext">Up to R5M directly injected into Verified Suppliers to fulfill your government/corporate Purchase Orders.</p>
                        <button class="btn btn-primary" style="margin-top: 1rem; width: 100%;" onclick="app.showAuth('SME')">Apply</button>
                    </div>
                    <div class="glass-card" style="background: var(--bg-color);">
                        <h3>Asset Finance</h3>
                        <p class="subtext">Equipment, machinery, and commercial vehicles structured with favorable asset-backed rates.</p>
                        <button class="btn btn-primary" style="margin-top: 1rem; width: 100%;" onclick="app.showAuth('SME')">Apply</button>
                    </div>
                    <div class="glass-card" style="background: var(--bg-color);">
                        <h3>Working Capital</h3>
                        <p class="subtext">Short-term bridging finance to manage operational cash flow gaps based on steady historical revenue.</p>
                        <button class="btn btn-primary" style="margin-top: 1rem; width: 100%;" onclick="app.showAuth('SME')">Apply</button>
                    </div>
                </div>
            </div>
    `);
    },

    showVerifiedSuppliers() {
        this.setView(`
    <div class="hero-enter" style = "max-width: 800px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.renderHome()">&larr; Home</button>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <div>
                        <h2>National Supplier Database</h2>
                        <p class="subtext">Access our verified ecosystem of suppliers to request instant quotes.</p>
                    </div>
                    <button class="btn btn-primary" onclick="app.showAuth('SUPPLIER')">Join as Supplier</button>
                </div>
                
                <div class="glass-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--border);">
                        <div><strong>Tech Innovators (Pty) Ltd</strong> <br><span class="subtext">IT Hardware & Software</span></div>
                        <span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--accent); margin: 0;">Verified</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--border);">
                        <div><strong>BuildItRight Construction</strong> <br><span class="subtext">Building Materials & Cement</span></div>
                        <span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--accent); margin: 0;">Verified</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem;">
                        <div><strong>AgriGrow Solutions</strong> <br><span class="subtext">Farming Equipment</span></div>
                        <span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--accent); margin: 0;">Verified</span>
                    </div>
                </div>
            </div>
        `);
    },

    async showAdminUsers() {
        // Fetch all users from Firestore
        const userSnapshot = await getDocs(collection(db, "users"));
        const allUsers = [];
        let stats = { total: 0, sme: 0, supplier: 0, funder: 0 };

        userSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            allUsers.push(data);
            stats.total++;
            if (data.type === 'SME') stats.sme++;
            else if (data.type === 'SUPPLIER') stats.supplier++;
            else if (data.type === 'FUNDER') stats.funder++;
        });

        this.setView(`
            <div class="hero-enter" style="max-width: 900px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back to Admin Panel</button>
                <h2>User Management Dashboard</h2>
                <p class="subtext" style="margin-bottom: 2rem;">Audit and manage all platform participants including SMEs, Funders, and Suppliers.</p>

                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;">
                    <div class="glass-card" style="padding: 1.5rem; text-align: center; border-left: 4px solid var(--primary);">
                        <h2 style="font-size: 2.5rem; color: var(--text-color); margin: 0;">${stats.total}</h2>
                        <span class="subtext" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Total Users</span>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem; text-align: center; border-left: 4px solid #3b82f6;">
                        <h2 style="font-size: 2.5rem; color: #3b82f6; margin: 0;">${stats.sme}</h2>
                        <span class="subtext" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">SMEs</span>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem; text-align: center; border-left: 4px solid var(--accent);">
                        <h2 style="font-size: 2.5rem; color: var(--accent); margin: 0;">${stats.supplier}</h2>
                        <span class="subtext" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Suppliers</span>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem; text-align: center; border-left: 4px solid #8b5cf6;">
                        <h2 style="font-size: 2.5rem; color: #8b5cf6; margin: 0;">${stats.funder}</h2>
                        <span class="subtext" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Funders</span>
                    </div>
                </div>

                <div class="glass-card" style="padding: 0; overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead style="background: var(--bg-hover); color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase;">
                            <tr>
                                <th style="padding: 1.2rem;">User Identity</th>
                                <th style="padding: 1.2rem;">Role Type</th>
                                <th style="padding: 1.2rem;">Account Status</th>
                                <th style="padding: 1.2rem; text-align: right;">Admin Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allUsers.length > 0 ? allUsers.map(u => `
                                <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
                                    <td style="padding: 1.2rem;">
                                        <div style="font-weight: 600;">${u.name || 'Anonymous User'}</div>
                                        <div class="subtext" style="font-size: 0.8rem;">${u.email || u.id}</div>
                                    </td>
                                    <td style="padding: 1.2rem;"><span class="badge" style="background: rgba(59, 130, 246, 0.1); color: var(--primary);">${u.type || 'SME'}</span></td>
                                    <td style="padding: 1.2rem;">
                                        <span class="status ${u.verified === true ? 'pulse' : ''}" 
                                              style="background: ${u.verified === true ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; 
                                                     color: ${u.verified === true ? 'var(--accent)' : '#ef4444'};">
                                            ${u.verified === true ? 'Active & Verified' : 'Application Pending'}
                                        </span>
                                    </td>
                                    <td style="padding: 1.2rem; text-align: right; display: flex; justify-content: flex-end; gap: 0.5rem;">
                                        <button class="btn btn-secondary btn-sm" onclick="app.showAdminUserVault('${u.id}')">Open Vault</button>
                                        ${u.verified !== true ? `<button class="btn btn-primary btn-sm" onclick="app.verifyVaultUser('${u.id}', '${this.escapeHTML(u.name)}', '${u.email}')">Verify Profile</button>` : ''}
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="4" style="padding: 3rem; text-align: center; color: var(--text-muted);">No platform users found in database.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `);
    },

    async showAdminFunderApproval() {
        const userSnapshot = await getDocs(collection(db, "users"));
        const pendingFunders = [];
        userSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.type === 'FUNDER' && data.verified === false) {
                pendingFunders.push(data);
            }
        });

        this.setView(`
            <div class="hero-enter" style="max-width: 800px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back to Admin Panel</button>
                <h2>Funder Escalation Board</h2>
                <p class="subtext" style="margin-bottom: 2rem;">Approve or reject capital partners who have joined through the Google Gateway.</p>

                ${pendingFunders.length > 0 ? pendingFunders.map(funder => `
                    <div class="glass-card" style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #8b5cf6;">
                        <div>
                            <h4 style="margin: 0 0 0.3rem 0; font-family: 'Outfit', sans-serif;">${funder.name}</h4>
                            <p class="subtext" style="margin: 0 0 0.5rem 0;">${funder.email}</p>
                            <span class="badge" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6; margin: 0;">Funder Identity Check Pending</span>
                        </div>
                        <div style="display: flex; gap: 0.8rem;">
                            <button class="btn btn-outline btn-sm" onclick="alert('Rejected ${funder.name} for platform access.')">Reject</button>
                            <button class="btn btn-primary btn-sm" onclick="app.verifyFunder('${funder.id}')">Verify & Enable</button>
                        </div>
                    </div>
                `).join('') : `
                    <div class="glass-card" style="text-align: center; padding: 5rem 2rem;">
                        <h4 style="color: var(--text-muted); font-weight: 500;">Zero Pending Funder Approvals</h4>
                        <p class="subtext">All funding entities currently on the platform are fully verified.</p>
                    </div>
                `}
            </div>
            </div>
        `);
    },

    async showAdminUserVault(uid) {
        try {
            const userSnap = await getDoc(doc(db, "users", uid));
            if (!userSnap.exists()) return alert("User not found.");
            const u = userSnap.data();

            this.setView(`
                <div class="hero-enter" style="max-width: 800px; margin: 2rem auto;">
                    <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showAdminUsers()">&larr; Back to Users List</button>
                    <h2>Platform Vault: ${u.name}</h2>
                    <p class="subtext" style="margin-bottom: 2rem;">Review identity and compliance records before issuing manual platform verification.</p>

                    <div class="glass-card" style="margin-bottom: 2rem;">
                        <h3 style="margin-top: 0; color: var(--primary);">Profile Data</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                            <div><strong>Role:</strong> <span class="badge" style="background: rgba(59,130,246,0.1); color: var(--primary);">${u.type}</span></div>
                            <div><strong>Email:</strong> ${u.email}</div>
                            <div><strong>Phone:</strong> ${u.phone || 'N/A'}</div>
                            <div><strong>Province:</strong> ${u.province || 'N/A'}</div>
                            ${u.type === 'SME' ? `<div><strong>CIPC Reg:</strong> ${u.registrationNumber || u.regNum || 'N/A'}</div>` : ''}
                            ${(u.type === 'SUPPLIER' || u.type === 'SME') ? `
                                <div><strong>Industry:</strong> ${Array.isArray(u.industry) ? u.industry.join(', ') : (u.industry || 'N/A')}</div>
                                <div><strong>Turnover:</strong> ${(u.onboardingData && u.onboardingData.annualTurnover) || 'N/A'}</div>
                                <div><strong>Years Active:</strong> ${(u.onboardingData && u.onboardingData.yearsInBusiness) || 'N/A'}</div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="glass-card" style="margin-bottom: 2rem; border-left: 4px solid var(--accent);">
                        <h3 style="margin-top: 0; color: var(--accent);">Uploaded Compliance Documents</h3>
                        <div style="background: rgba(16, 185, 129, 0.05); padding: 1.5rem; text-align: center; border: 1px dashed var(--accent); margin-top: 1rem; border-radius: 8px;">
                            <p style="margin: 0; color: var(--text-color);">No physical documents uploaded yet.</p>
                            <p class="subtext" style="font-size: 0.85rem; margin-top: 0.5rem;">The user has self-certified their details during onboarding.</p>
                        </div>
                    </div>

                    <div style="display: flex; gap: 1rem;">
                        ${u.verified !== true ? `
                            <button class="btn btn-primary" style="flex: 1;" onclick="app.verifyVaultUser('${u.id}', '${u.name}', '${u.email}')">Manually Verify & Send Email</button>
                        ` : `
                            <button class="btn btn-primary" style="flex: 1;" disabled>User is Already Verified</button>
                        `}
                        <button class="btn btn-outline" style="flex: 1; color: #ef4444; border-color: rgba(239,68,68,0.3);" onclick="alert('Account Suspended.'); app.showAdminUsers();">Suspend Account</button>
                    </div>
                </div>
            `);
        } catch (error) {
            console.error(error);
            alert("Error loading vault.");
        }
    },

    async verifyVaultUser(uid, name, email) {
        if (!confirm(`Are you sure you want to verify ${name}?\n\nThis will trigger an automated approval email to ${email}.`)) return;

        try {
            const userRef = doc(db, "users", uid);
            await setDoc(userRef, { verified: true }, { merge: true });

            // Automated Email Pipeline
            await this.sendNotification(uid, email, `✅ PROFILE VERIFIED: Your ProcFin account has been fully verified by the Admin. An automated confirmation email has been dispatched to ${email}.`);

            alert(`Success! Profile marked as VERIFIED.\n\n[MOCK EMAIL TRIGGERED to ${email}]`);
            this.showAdminUsers();
        } catch (error) {
            console.error("Verification Error:", error);
            alert("System Error: Could not verify user.");
        }
    },

    async verifyFunder(uid) {
        try {
            const userRef = doc(db, "users", uid);
            await setDoc(userRef, { verified: true }, { merge: true });
            const funderDoc = await getDoc(userRef);
            if (funderDoc.exists()) {
                await this.sendNotification(uid, funderDoc.data().email, "✅ FUNDER VERIFIED: Your entity has been approved to structure deals on ProcFin.");
            }
            alert("Verification Success: Funder is now active and can structure deals!");
            this.showAdminFunderApproval();
        } catch (error) {
            console.error("Verification Error:", error);
            alert("Platform Error: Verification update failed.");
        }
    },

    async showAdminActivity() {
        // Fetch last 50 notifications or logs
        const logs = [
            { id: 1, type: 'USER', event: 'New SME Joined', detail: 'Cape Town Logistics Ltd', time: '2m ago' },
            { id: 2, type: 'DEAL', event: 'Offer Submitted', detail: 'Funder ID: Alpha Capital', time: '15m ago' },
            { id: 3, type: 'DOC', event: 'Vault Upload', detail: 'Tax Clearance - My SME', time: '1h ago' },
            { id: 4, type: 'AUTH', event: 'Admin Login', detail: 'Root Session Started', time: '3h ago' }
        ];

        this.setView(`
            <div class="hero-enter" style="max-width: 800px; margin: 2rem auto;">
                <button class="btn btn-secondary" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back to Admin Panel</button>
                <h2>System Activity Log</h2>
                <p class="subtext" style="margin-bottom: 2rem;">Real-time stream of all sensitive platform events and state changes.</p>

                <div class="glass-card" style="padding: 0; overflow: hidden;">
                    ${logs.map(log => `
                        <div style="border-bottom: 1px solid var(--border); padding: 1.2rem; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span class="badge" style="margin-bottom: 0.5rem; font-size: 0.7rem; background: rgba(59,130,246,0.1); color: var(--primary);">${log.type}</span>
                                <h4 style="margin: 0;">${log.event}</h4>
                                <p class="subtext" style="margin: 0.2rem 0 0 0; font-size: 0.85rem;">${log.detail}</p>
                            </div>
                            <span class="subtext" style="font-size: 0.8rem;">${log.time}</span>
                        </div>
                    `).join('')}
                    <div style="padding: 1rem; text-align: center; background: var(--secondary);">
                        <p class="subtext" style="font-size: 0.75rem;">Showing most recent 50 events. <a href="#" style="color: var(--primary);">Export CSV Log</a></p>
                    </div>
                </div>
            </div>
        `);
    },

    renderSuggestiveActions() {
        const u = this.user;
        let actions = [];

        if (u.type === 'SME') {
            if (!u.subscribed) {
                actions.push({
                    title: "Unlock Marketplace",
                    text: "Subscribe to start requesting quotes and applying for funding.",
                    btnText: "View SME Plans",
                    action: "app.showDashboard()"
                });
            } else if (!u.industry || (Array.isArray(u.industry) && u.industry.length === 0)) {
                actions.push({
                    title: "Target Your Industry",
                    text: "Complete your profile industries to get accurate supplier matches.",
                    btnText: "Update Industries",
                    action: "app.showProfileEdit()"
                });
            } else if (this.rfqs.filter(r => r.smeId === u.id).length === 0) {
                actions.push({
                    title: "First RFQ Request",
                    text: "Ready to buy? Broadcast your first quote request to verified suppliers.",
                    btnText: "Broadcast RFQ",
                    action: "app.showQuoteRequest()"
                });
            }
        }

        if (u.type === 'SUPPLIER') {
            if (!u.subscribed) {
                actions.push({
                    title: "Become Verified",
                    text: "Verified suppliers get instant RFQ pings and guaranteed payouts.",
                    btnText: "Verify Now",
                    action: "app.showSubscriptionCheckout()"
                });
            } else if (!u.industry || (Array.isArray(u.industry) && u.industry.length === 0)) {
                actions.push({
                    title: "Add Service Categories",
                    text: "Tell us what you sell to start receiving matched quotation requests.",
                    btnText: "Add Categories",
                    action: "app.showProfileEdit()"
                });
            } else if (u.verified !== true) {
                 actions.push({
                    title: "Vault Verification",
                    text: "Admin check is pending. Ensure your Tax & CSD docs are uploaded.",
                    btnText: "Go to Vault",
                    action: "app.showDocumentRepo()"
                });
            }
        }

        if (actions.length === 0) return '';

        return `
            <div class="glass-card" style="grid-column: 1 / -1; border: 1px solid var(--primary); border-left: 5px solid var(--primary); background: rgba(59, 130, 246, 0.03);">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div class="icon-circle" style="background: var(--primary); color: white; margin: 0; width: 32px; height: 32px; font-size: 0.9rem;">🚀</div>
                    <h4 style="margin: 0;">Priority Next Steps</h4>
                </div>
                <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
                    ${actions.map(a => `
                        <div style="flex: 1; min-width: 250px;">
                            <h5 style="margin: 0 0 0.25rem 0; color: var(--primary);">${a.title}</h5>
                            <p class="subtext" style="font-size: 0.85rem; margin-bottom: 1rem;">${a.text}</p>
                            <button class="btn btn-primary btn-sm" onclick="${a.action}">${a.btnText}</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    showAdminAPIKeys() {
        this.setView(`
            <div class="hero-enter" style="max-width: 600px; margin: 4rem auto;">
                <button class="btn btn-secondary btn-sm" style="margin-bottom: 2rem;" onclick="app.showDashboard()">&larr; Back to Admin Panel</button>
                <h2>System Secrets & API Gateway</h2>
                <p class="subtext" style="margin-bottom: 2rem;">Manage integration tokens for Firebase, PayStack, and SMS Gateways.</p>

                <div class="glass-card">
                    <div style="margin-bottom: 2rem;">
                        <h4 style="margin-bottom: 1rem;">Primary Gateway Access</h4>
                        <div style="background: var(--bg-color); border: 1px solid var(--border); padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center;">
                            <span>${firebaseConfig.apiKey.substring(0, 10)}********************</span>
                            <button class="btn btn-outline btn-sm" onclick="alert('Master Key rotation requires manual Firebase Console intervention.')">Rotate Key</button>
                        </div>
                    </div>

                    <div style="margin-bottom: 2rem; border-top: 1px solid var(--border); padding-top: 2rem;">
                        <h4 style="margin-bottom: 1rem;">Payment Integration (PayStack Mock)</h4>
                        <div style="display: grid; gap: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span class="subtext">Public Key</span>
                                <span style="font-family: monospace;">pk_test_9281...</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span class="subtext">Secret Key</span>
                                <span style="font-family: monospace;">sk_test_••••••••</span>
                            </div>
                        </div>
                    </div>

                    <div style="text-align: right; margin-top: 2rem;">
                        <button class="btn btn-primary" onclick="alert('Platform Error: Key Management is currently in Read-Only mode.')">Update Core Config</button>
                    </div>
                </div>
                
                <div style="margin-top: 2rem; background: rgba(239, 68, 68, 0.05); padding: 1.5rem; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.1);">
                    <h4 style="color: #ef4444; margin-bottom: 0.5rem;">Security Warning</h4>
                    <p class="subtext" style="font-size: 0.85rem;">Rotating keys may temporarily disable SME deal structuring or Supplier subscription payments until the sync completes.</p>
                </div>
            </div>
        `);
    }
};

window.app = app;
document.addEventListener('DOMContentLoaded', () => app.init());
