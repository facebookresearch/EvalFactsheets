// Copyright (c) Meta Platforms, Inc. and affiliates.

// ===== GLOBAL VARIABLES =====
let currentFormat = 'latex';

// Explorer variables
let allData = [];
let filteredData = [];
let currentSort = { column: null, direction: 'asc' };

// Column definitions for explorer
const allColumns = [
    'title', 'subtitle', 'authors', 'link', 'code_link', 'date', 'purpose', 'principles_tested',
    'functional_props', 'input_modality', 'output_modality', 'input_source',
    'output_source', 'size', 'splits', 'design', 'judge', 'protocol',
    'model_access', 'has_heldout', 'heldout_details', 'alignment_validation',
    'is_valid', 'baseline_models', 'robustness_measures', 'known_limitations',
    'benchmarks_list'
];

// ===== TAB NAVIGATION =====
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // Save active tab to localStorage
            localStorage.setItem('activeTab', tabName);
        });
    });
    
    // Restore last active tab
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
        const savedButton = document.querySelector(`[data-tab="${savedTab}"]`);
        if (savedButton) {
            savedButton.click();
        }
    }
}

// ===== DARK MODE TOGGLE =====
function initThemeToggle() {
    const html = document.documentElement;
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    
    // Create theme toggle button
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
    themeToggle.setAttribute('aria-label', 'Toggle theme');
    document.body.appendChild(themeToggle);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
    });
}

// ===== FORM AUTO-SAVE FUNCTIONS =====
function saveFormData() {
    const formData = {};
    
    // Save text inputs and textareas
    const textFields = ['title', 'subtitle', 'authors', 'link', 'code_link', 'date', 
                       'purpose', 'principlesTested', 'functionalProps', 'inputModality', 
                       'outputModality', 'inputSource', 'outputSource', 'size', 'splits', 
                       'design', 'judge', 'protocol', 'modelAccess', 'heldoutDetails',
                       'alignmentValidation', 'baselineModels', 'robustnessMeasures', 
                       'knownLimitations', 'benchmarksList',
                       'purposeCustom', 'functionalPropsCustom', 'inputModalityCustom',
                       'outputModalityCustom', 'inputSourceCustom', 'outputSourceCustom',
                       'sizeCustom', 'designCustom', 'judgeCustom', 'robustnessMeasuresCustom'];
    
    textFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            formData[field] = element.value;
        }
    });
    
    // Save select elements (including multi-select)
    const selectFields = ['purpose', 'functionalProps', 'inputModality', 'outputModality',
                         'inputSource', 'outputSource', 'size', 'splits', 'design',
                         'judge', 'modelAccess', 'isValid', 'robustnessMeasures'];
    
    selectFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            if (element.multiple) {
                // For multi-select, save array of selected values
                formData[field] = Array.from(element.selectedOptions).map(opt => opt.value);
            } else {
                formData[field] = element.value;
            }
        }
    });
    
    // Save checkboxes
    const hasHeldout = document.getElementById('hasHeldout');
    if (hasHeldout) formData.hasHeldout = hasHeldout.checked;
    
    // const isValid = document.getElementById('isValid');
    // if (isValid) formData.isValid = isValid.checked;
    
    // Save to localStorage
    localStorage.setItem('evalFormData', JSON.stringify(formData));
}

function restoreFormData() {
    const savedData = localStorage.getItem('evalFormData');
    if (!savedData) return;
    
    try {
        const formData = JSON.parse(savedData);
        
        // Restore text inputs and textareas
        Object.keys(formData).forEach(field => {
            const element = document.getElementById(field);
            if (!element) return;
            
            if (element.type === 'checkbox') {
                element.checked = formData[field];
                // Trigger change event for hasHeldout to show/hide details
                if (field === 'hasHeldout') {
                    element.dispatchEvent(new Event('change'));
                }
            } else if (element.tagName === 'SELECT' && element.multiple) {
                // Restore multi-select values
                const values = formData[field];
                if (Array.isArray(values)) {
                    Array.from(element.options).forEach(option => {
                        option.selected = values.includes(option.value);
                    });
                }
            } else if (element.tagName === 'SELECT' || element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = formData[field] || '';
            }
        });
        
        console.log('✓ Form data restored from previous session');
    } catch (error) {
        console.error('Error restoring form data:', error);
    }
}

function clearSavedFormData() {
    localStorage.removeItem('evalFormData');
    console.log('✓ Saved form data cleared');
}

// ===== FORM FUNCTIONS =====
function initializeForm() {
    const form = document.getElementById('evaluationForm');
    if (!form) return;
    
    const outputSection = document.getElementById('outputSection');
    const output = document.getElementById('output');
    const resetBtn = document.getElementById('resetBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const formatBtns = document.querySelectorAll('.format-btn');

    // CSV GitHub helper elements
    const csvGithubHelper = document.getElementById('csvGithubHelper');
    const csvCopyBox = document.getElementById('csvCopyBox');
    const copyCsvBtn = document.getElementById('copyCsvBtn');
    const githubPRBtn = document.getElementById('githubPRBtn');

    // Held-out test checkbox handler
    const hasHeldoutCheckbox = document.getElementById('hasHeldout');
    const heldoutDetailsGroup = document.getElementById('heldoutDetailsGroup');
    if (heldoutDetailsGroup) {
        heldoutDetailsGroup.style.display = 'none';
    }
    if (hasHeldoutCheckbox && heldoutDetailsGroup) {
        hasHeldoutCheckbox.addEventListener('change', function() {
            heldoutDetailsGroup.style.display = this.checked ? 'block' : 'none';
        });
    }

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        try {
            const data = getFormData();
            let code;
            if (currentFormat === 'latex') {
                code = buildLatexCode(data);
            } else if (currentFormat === 'markdown') {
                code = buildMarkdownCode(data);
            } else if (currentFormat === 'csv') {
                code = getCSVHeader() + '\n' + buildCSVLine(data);
            } else if (currentFormat === 'yaml') {
                code = buildYAML(data);
            }
            output.textContent = code;
            if (outputSection) {
                outputSection.setAttribute('data-csv', buildCSVLine(data));
                outputSection.style.display = 'block';
            }
            if (csvGithubHelper) {
                updateCsvGithubHelper();
            }
            output.scrollTop = 0;
        } catch (error) {
            console.error('Error generating output:', error);
            alert('Error generating output: ' + error.message);
        }
    });

    // Format toggle buttons
    if (formatBtns) {
        formatBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                formatBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFormat = this.getAttribute('data-format');
                if (outputSection && outputSection.style.display !== 'none') {
                    form.dispatchEvent(new Event('submit'));
                }
            });
        });
    }

    // Reset button with confirmation
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to reset the form? This will clear all your saved data.')) {
                form.reset();
                if (outputSection) outputSection.style.display = 'none';
                if (heldoutDetailsGroup) heldoutDetailsGroup.style.display = 'none';
                if (csvGithubHelper) csvGithubHelper.style.display = 'none';
                clearSavedFormData();
            }
        });
    }

    // Copy button
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const code = output.textContent;
            navigator.clipboard.writeText(code).then(() => {
                const originalText = this.textContent;
                this.textContent = '✅ Copied!';
                this.classList.add('success');
                setTimeout(() => {
                    this.textContent = originalText;
                    this.classList.remove('success');
                }, 2000);
            });
        });
    }

    // Download button
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            const code = output.textContent;
            let filename, mimeType;
            if (currentFormat === 'latex') {
                filename = 'evaluation_card.tex';
                mimeType = 'text/x-latex';
            } else if (currentFormat === 'csv') {
                filename = 'evaluation_card.csv';
                mimeType = 'text/csv';
            } else if (currentFormat === 'markdown') {
                filename = 'evaluation_card.md';
                mimeType = 'text/markdown';
            } else if (currentFormat === 'yaml') {
                filename = 'evaluation_card.yaml';
                mimeType = 'text/yaml';
            } else {
                filename = 'evaluation_card.txt';
                mimeType = 'text/plain';
            }
            const blob = new Blob([code], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // Clear button functionality for multi-selects
    const clearButtons = document.querySelectorAll('.clear-btn');
    clearButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const select = document.getElementById(targetId);
            if (select) {
                Array.from(select.options).forEach(option => {
                    option.selected = false;
                });
                saveFormData(); // Save after clearing
            }
        });
    });

    // CSV GitHub helper logic
    function updateCsvGithubHelper() {
        if (outputSection && outputSection.style.display !== 'none') {
            const csvLine = buildCSVLine(getFormData());
            if (csvCopyBox) csvCopyBox.value = csvLine;
            if (csvGithubHelper) csvGithubHelper.style.display = 'block';
        }
    }

    if (copyCsvBtn) {
        copyCsvBtn.addEventListener('click', function() {
            if (csvCopyBox) {
                csvCopyBox.select();
                document.execCommand('copy');
                this.textContent = '✅ Copied!';
                setTimeout(() => {
                    this.textContent = '📋 Copy CSV Line';
                }, 2000);
            }
        });
    }

    if (githubPRBtn) {
        githubPRBtn.addEventListener('click', function() {
            const url = 'https://github.com/fairinternal/EvalCard/edit/main/evaluation_cards_database.csv';
            window.open(url, '_blank');
        });
    }
    
    // ===== AUTO-SAVE SETUP =====
    // Restore saved form data on load
    restoreFormData();
    
    // Add auto-save listeners to all form inputs
    const autoSaveElements = form.querySelectorAll('input, textarea, select');
    autoSaveElements.forEach(element => {
        element.addEventListener('input', saveFormData);
        element.addEventListener('change', saveFormData);
    });
}

// Get form data
function getFormData() {
    const data = {};
    
    const textFields = ['title', 'subtitle', 'authors', 'link', 'code_link', 'date', 
                       'purpose', 'principlesTested', 'functionalProps', 'inputModality', 
                       'outputModality', 'inputSource', 'outputSource', 'size', 'splits', 
                       'design', 'judge', 'protocol', 'modelAccess', 'isValid', 'heldoutDetails',
                       'alignmentValidation', 'baselineModels', 'robustnessMeasures', 
                       'knownLimitations', 'benchmarksList'];
    
    textFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            data[field] = element.value || '';
        }
    });
    
    const hasHeldout = document.getElementById('hasHeldout');
    data.hasHeldout = hasHeldout ? hasHeldout.checked : false;
    
    // const isValid = document.getElementById('isValid');
    // data.isValid = isValid ? isValid.checked : false;
    
    return data;
}

function escapeLatex(text) {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/~/g, '\\textasciitilde{}')
        .replace(/\^/g, '\\textasciicircum{}')
        .replace(/[&%$#_{}]/g, '\\$&');
}

function buildLatexCode(data) {
    let latex = `\\documentclass{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{evaluationcard}

\\begin{document}

\\begin{evaluationcard}[
  title={${escapeLatex(data.title)}}${data.subtitle ? `,\n  subtitle={${escapeLatex(data.subtitle)}}` : ''}${data.authors ? `,\n  authors={${escapeLatex(data.authors)}}` : ''}${data.link ? `,\n  link={${data.link}}` : ''}${data.code_link ? `,\n  code-link={${data.code_link}}` : ''}${data.date ? `,\n  date={${data.date}}` : ''}
]

`;

    latex += `% What Does It Evaluate?\n`;
    if (data.purpose) latex += `  \\Purpose{${escapeLatex(data.purpose)}}\n`;
    if (data.principlesTested) latex += `  \\PrinciplesTested{${escapeLatex(data.principlesTested)}}\n`;
    if (data.functionalProps) latex += `  \\FunctionalProps{${escapeLatex(data.functionalProps)}}\n`;
    if (data.inputModality) latex += `  \\InputModality{${escapeLatex(data.inputModality)}}\n`;
    if (data.outputModality) latex += `  \\OutputModality{${escapeLatex(data.outputModality)}}\n`;
    latex += `\n`;

    latex += `% How Is It Structured?\n`;
    if (data.inputSource) latex += `  \\InputSource{${escapeLatex(data.inputSource)}}\n`;
    if (data.outputSource) latex += `  \\OutputSource{${escapeLatex(data.outputSource)}}\n`;
    if (data.size) latex += `  \\Size{${escapeLatex(data.size)}}\n`;
    if (data.splits) latex += `  \\Splits{${escapeLatex(data.splits)}}\n`;
    if (data.design) latex += `  \\Design{${escapeLatex(data.design)}}\n`;
    latex += `\n`;

    latex += `% How Does It Work?\n`;
    if (data.judge) latex += `  \\Judge{${escapeLatex(data.judge)}}\n`;
    if (data.protocol) {
        const protocols = data.protocol.split('\n').filter(line => line.trim());
        const formatted = protocols.map((p, i) => `${i + 1}. ${escapeLatex(p.trim())}`).join(' ');
        latex += `  \\Protocol{${formatted}}\n`;
    }
    if (data.modelAccess) latex += `  \\ModelAccess{${escapeLatex(data.modelAccess)}}\n`;
    if (data.hasHeldout) {
        latex += `  \\HeldoutTest{Yes}\n`;
        if (data.heldoutDetails) {
            latex += `  \\HeldoutDetails{${escapeLatex(data.heldoutDetails)}}\n`;
        }
    }
    latex += `\n`;

    latex += `% Quality & Reliability\n`;
    if (data.alignmentValidation) latex += `  \\AlignmentValidation{${escapeLatex(data.alignmentValidation)}}\n`;
    if (data.isValid) latex += `  \\IsValid{${escapeLatex(data.isValid)}}\n`;
    if (data.baselineModels) latex += `  \\BaselineModels{${escapeLatex(data.baselineModels)}}\n`;
    if (data.robustnessMeasures) latex += `  \\RobustnessMeasures{${escapeLatex(data.robustnessMeasures)}}\n`;
    if (data.knownLimitations) latex += `  \\KnownLimitations{${escapeLatex(data.knownLimitations)}}\n`;
    latex += `\n`;

    if (data.benchmarksList) {
        latex += `  \\BenchmarksList{${escapeLatex(data.benchmarksList)}}\n`;
    }

    latex += `\\end{evaluationcard}

\\end{document}`;

    return latex;
}

function buildMarkdownCode(data) {
    let markdown = `# ${data.title || 'Evaluation Card'}\n\n`;
    
    if (data.subtitle) {
        markdown += `## ${data.subtitle}\n\n`;
    }
    
    if (data.authors || data.date || data.link || data.code_link) {
        markdown += `---\n\n`;
        if (data.authors) markdown += `**Authors:** ${data.authors}\n\n`;
        if (data.date) markdown += `**Date:** ${data.date}\n\n`;
        if (data.link) markdown += `**Paper:** [${data.link}](${data.link})\n\n`;
        if (data.code_link) markdown += `**Code:** [${data.code_link}](${data.code_link})\n\n`;
        markdown += `---\n\n`;
    }
    
    markdown += `### What Does It Evaluate?\n\n`;
    let evaluateItems = [];
    if (data.purpose) evaluateItems.push(`**Purpose:** ${data.purpose}`);
    if (data.principlesTested) evaluateItems.push(`**Principles Tested:** ${data.principlesTested}`);
    if (data.functionalProps) evaluateItems.push(`**Functional Properties:** ${data.functionalProps}`);
    if (data.inputModality) evaluateItems.push(`**Input Modality:** ${data.inputModality}`);
    if (data.outputModality) evaluateItems.push(`**Output Modality:** ${data.outputModality}`);
    if (evaluateItems.length > 0) {
        markdown += evaluateItems.join('  \n') + '\n\n';
    }
    markdown += `---\n\n`;
    
    markdown += `### How Is It Structured?\n\n`;
    let structureItems = [];
    if (data.inputSource) structureItems.push(`**Input Source:** ${data.inputSource}`);
    if (data.outputSource) structureItems.push(`**Output Source:** ${data.outputSource}`);
    if (data.size) structureItems.push(`**Size:** ${data.size}`);
    if (data.splits) structureItems.push(`**Splits:** ${data.splits}`);
    if (data.design) structureItems.push(`**Design:** ${data.design}`);
    if (structureItems.length > 0) {
        markdown += structureItems.join('  \n') + '\n\n';
    }
    markdown += `---\n\n`;
    
    markdown += `### How Does It Work?\n\n`;
    if (data.judge) markdown += `**Judge:** ${data.judge}\n\n`;
    if (data.protocol) {
        markdown += `**Evaluation Protocol:**\n\n`;
        const protocols = data.protocol.split('\n').filter(line => line.trim());
        protocols.forEach((protocol, index) => {
            markdown += `${index + 1}. ${protocol.trim()}\n`;
        });
        markdown += `\n`;
    }
    if (data.modelAccess) markdown += `**Model Access Required:** ${data.modelAccess}\n\n`;
    if (data.hasHeldout) {
        markdown += `**Held-out Test:** ✅ Yes\n\n`;
        if (data.heldoutDetails) {
            markdown += `<details>\n<summary><b>🔒 Held-out Test Details</b></summary>\n\n`;
            markdown += `${data.heldoutDetails}\n\n`;
            markdown += `</details>\n\n`;
        }
    }
    markdown += `---\n\n`;
    
    markdown += `### Quality & Reliability\n\n`;
    if (data.alignmentValidation) {
        markdown += `**Measurement Validation:**\n\n${data.alignmentValidation}\n\n`;
    }
    if (data.isValid) {
        markdown += `✅ **Construct Validity:** This evaluation meets ${data.isValid} conditions of the Bean et al. 2025 construct validity checklist.\n\n`;
    }
    if (data.baselineModels) markdown += `**Baseline Models:** ${data.baselineModels}\n\n`;
    if (data.robustnessMeasures) markdown += `**Robustness Measures:** ${data.robustnessMeasures}\n\n`;
    if (data.knownLimitations) {
        markdown += `**Known Limitations:**\n\n${data.knownLimitations}\n\n`;
    }
    if (data.benchmarksList) {
        markdown += `---\n\n### Related Benchmarks\n\n${data.benchmarksList}\n`;
    }
    
    return markdown;
}

function buildCSVLine(data) {
    const fields = [
        data.title || '', data.subtitle || '', data.authors || '', data.link || '',
        data.code_link || '', data.date || '', data.purpose || '', data.principlesTested || '',
        data.functionalProps || '', data.inputModality || '', data.outputModality || '',
        data.inputSource || '', data.outputSource || '', data.size || '', data.splits || '',
        data.design || '', data.judge || '', data.protocol || '', data.modelAccess || '',
        data.hasHeldout ? 'Yes' : 'No', data.heldoutDetails || '', data.alignmentValidation || '',
        data.isValid || '', data.baselineModels || '', data.robustnessMeasures || '',
        data.knownLimitations || '', data.benchmarksList || ''
    ];
    return fields.map(f => escapeCSV(f)).join(',');
}

function escapeCSV(text) {
    if (!text) return '""';
    text = String(text);
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        text = '"' + text.replace(/"/g, '""') + '"';
    } else {
        text = '"' + text + '"';
    }
    return text;
}

function getCSVHeader() {
    return 'title,subtitle,authors,link,code_link,date,purpose,principles_tested,functional_props,input_modality,output_modality,input_source,output_source,size,splits,design,judge,protocol,model_access,has_heldout,heldout_details,alignment_validation,is_valid,baseline_models,robustness_measures,known_limitations,benchmarks_list';
}

function buildYAML(data) {
    function yamlEscape(str) {
        if (typeof str !== 'string') return str;
        if (str.includes(':') || str.includes('\n') || str.includes('"') || str.includes("'") || str.includes('#') || str.includes(',')) {
            return `"${str.replace(/"/g, '\\"')}"`;
        }
        return str;
    }
    let yaml = '';
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'boolean') {
            yaml += `${key}: ${value}\n`;
        } else if (Array.isArray(value)) {
            yaml += `${key}:\n`;
            value.forEach(item => {
                yaml += `  - ${yamlEscape(item)}\n`;
            });
        } else {
            yaml += `${key}: ${yamlEscape(value)}\n`;
        }
    }
    return yaml;
}

// ===== EXPLORER FUNCTIONS =====
async function initializeExplorer() {
    await loadData();
    populateFilters();
    setupExplorerEventListeners();
    displayData(allData);
}

async function loadData() {
    try {
        const response = await fetch('evaluation_cards_database.csv');
        const csvText = await response.text();
        allData = parseCSV(csvText);
        filteredData = [...allData];
        console.log(`Loaded ${allData.length} records from CSV`);
    } catch (error) {
        console.error('Error loading data:', error);
        const tableBody = document.getElementById('tableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="26" style="text-align:center;color:red;">Error loading CSV file. Make sure evaluation_cards_database.csv is in the same folder.</td></tr>';
        }
    }
}

function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] ? values[index].trim() : '';
            });
            data.push(obj);
        }
    }
    return data;
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    return values.map(v => v.replace(/^"|"$/g, ''));
}

function populateFilters() {
    const modalities = new Set();
    const purposes = new Set();
    const designs = new Set();
    
    allData.forEach(item => {
        if (item.input_modality) modalities.add(item.input_modality);
        if (item.purpose) purposes.add(item.purpose);
        if (item.design) designs.add(item.design);
    });
    
    populateSelect('modalityFilter', Array.from(modalities).sort());
    populateSelect('purposeFilter', Array.from(purposes).sort());
    populateSelect('designFilter', Array.from(designs).sort());
}

function populateSelect(id, options) {
    const select = document.getElementById(id);
    if (!select) return;
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
    });
}

function setupExplorerEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', filterData);
    
    const clearSearch = document.getElementById('clearSearch');
    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            ['modalityFilter', 'purposeFilter', 'designFilter', 'validFilter'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            filterData();
        });
    }
    
    ['modalityFilter', 'purposeFilter', 'designFilter', 'validFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', filterData);
    });
    
    const toggleColumns = document.getElementById('toggleColumns');
    if (toggleColumns) {
        toggleColumns.addEventListener('click', () => {
            const columnToggles = document.getElementById('columnToggles');
            if (columnToggles) columnToggles.classList.toggle('hidden');
        });
    }
    
    document.querySelectorAll('.col-toggle').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const col = e.target.getAttribute('data-col');
            const cells = document.querySelectorAll(`[data-col="${col}"]`);
            cells.forEach(cell => {
                cell.classList.toggle('hidden', !e.target.checked);
            });
        });
    });
    
    const exportBtn = document.getElementById('exportCSV');
    if (exportBtn) exportBtn.addEventListener('click', exportToCSV);
    
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort');
            sortTable(column);
        });
    });
    
    const closeBtn = document.querySelector('.close');
    if (closeBtn) closeBtn.onclick = closeModal;
    
    window.onclick = function(event) {
        const modal = document.getElementById('detailModal');
        if (event.target === modal) closeModal();
    };
}

function filterData() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    const filters = {
        modality: document.getElementById('modalityFilter')?.value || '',
        purpose: document.getElementById('purposeFilter')?.value || '',
        design: document.getElementById('designFilter')?.value || '',
        valid: document.getElementById('validFilter')?.value || ''
    };
    
    filteredData = allData.filter(item => {
        const matchesSearch = !searchTerm || Object.values(item).some(val => 
            String(val).toLowerCase().includes(searchTerm)
        );
        const matchesModality = !filters.modality || item.input_modality === filters.modality;
        const matchesPurpose = !filters.purpose || item.purpose === filters.purpose;
        const matchesDesign = !filters.design || item.design === filters.design;
        const matchesValid = !filters.valid || 
            (filters.valid === 'yes' && item.is_valid?.toLowerCase() === 'yes') ||
            (filters.valid === 'no' && item.is_valid?.toLowerCase() !== 'yes');
        
        return matchesSearch && matchesModality && matchesPurpose && matchesDesign && matchesValid;
    });
    
    displayData(filteredData);
}

function sortTable(column) {
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });
    
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    
    filteredData.sort((a, b) => {
        let aVal = a[column] || '';
        let bVal = b[column] || '';
        
        if (column === 'date') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        } else {
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
        }
        
        if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    const header = document.querySelector(`th[data-sort="${column}"]`);
    if (header) header.classList.add(`sorted-${currentSort.direction}`);
    
    displayData(filteredData);
}

function displayData(data) {
    const tbody = document.getElementById('tableBody');
    const resultCount = document.getElementById('resultCount');
    
    if (!tbody) return;
    
    if (resultCount) {
        resultCount.textContent = `${data.length} result${data.length !== 1 ? 's' : ''}`;
    }
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="26" style="text-align:center;color:#6c757d;">No results found</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map((item, index) => `
        <tr>
            <td class="cell-title" data-col="title" title="${escapeHtml(item.title || '')}">${escapeHtml(item.title || 'N/A')}</td>
            <td class="cell-medium hidden" data-col="subtitle" title="${escapeHtml(item.subtitle || '')}">${escapeHtml(truncate(item.subtitle, 50))}</td>
            <td class="cell-medium hidden" data-col="authors" title="${escapeHtml(item.authors || '')}">${escapeHtml(truncate(item.authors, 40))}</td>
            <td class="cell-short" data-col="date">${escapeHtml(item.date || 'N/A')}</td>
            <td class="cell-medium hidden" data-col="purpose" title="${escapeHtml(item.purpose || '')}">${escapeHtml(truncate(item.purpose, 60))}</td>
            <td class="cell-medium hidden" data-col="principles_tested" title="${escapeHtml(item.principles_tested || '')}">${escapeHtml(truncate(item.principles_tested, 50))}</td>
            <td class="cell-medium hidden" data-col="functional_props" title="${escapeHtml(item.functional_props || '')}">${escapeHtml(truncate(item.functional_props, 50))}</td>
            <td class="cell-short" data-col="input_modality">${escapeHtml(item.input_modality || 'N/A')}</td>
            <td class="cell-short" data-col="output_modality">${escapeHtml(item.output_modality || 'N/A')}</td>
            <td class="cell-medium" data-col="input_source" title="${escapeHtml(item.input_source || '')}">${escapeHtml(truncate(item.input_source, 50))}</td>
            <td class="cell-medium hidden" data-col="output_source" title="${escapeHtml(item.output_source || '')}">${escapeHtml(truncate(item.output_source, 50))}</td>
            <td class="cell-short hidden" data-col="size">${escapeHtml(item.size || 'N/A')}</td>
            <td class="cell-short hidden" data-col="splits">${escapeHtml(item.splits || 'N/A')}</td>
            <td class="cell-short hidden" data-col="design">${escapeHtml(item.design || 'N/A')}</td>
            <td class="cell-medium" data-col="judge" title="${escapeHtml(item.judge || '')}">${escapeHtml(truncate(item.judge, 40))}</td>
            <td class="cell-long hidden" data-col="protocol" title="${escapeHtml(item.protocol || '')}">${escapeHtml(truncate(item.protocol, 80))}</td>
            <td class="cell-short hidden" data-col="model_access">${escapeHtml(item.model_access || 'N/A')}</td>
            <td class="cell-short" data-col="has_heldout">${getBadge(item.has_heldout)}</td>
            <td class="cell-long hidden" data-col="heldout_details" title="${escapeHtml(item.heldout_details || '')}">${escapeHtml(truncate(item.heldout_details, 60))}</td>
            <td class="cell-long hidden" data-col="alignment_validation" title="${escapeHtml(item.alignment_validation || '')}">${escapeHtml(truncate(item.alignment_validation, 60))}</td>
            <td class="cell-short hidden" data-col="is_valid">${getBadge(item.is_valid)}</td>
            <td class="cell-medium hidden" data-col="baseline_models" title="${escapeHtml(item.baseline_models || '')}">${escapeHtml(truncate(item.baseline_models, 50))}</td>
            <td class="cell-medium hidden" data-col="robustness_measures" title="${escapeHtml(item.robustness_measures || '')}">${escapeHtml(truncate(item.robustness_measures, 50))}</td>
            <td class="cell-long hidden" data-col="known_limitations" title="${escapeHtml(item.known_limitations || '')}">${escapeHtml(truncate(item.known_limitations, 60))}</td>
            <td class="cell-long hidden" data-col="benchmarks_list" title="${escapeHtml(item.benchmarks_list || '')}">${escapeHtml(truncate(item.benchmarks_list, 60))}</td>
            <td class="actions-col">
                <button class="btn-view" onclick="viewDetails(${index})">View</button>
                ${item.link ? `<a href="${escapeHtml(item.link)}" target="_blank" class="btn-link">Link</a>` : ''}
            </td>
        </tr>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncate(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function getBadge(value) {
    if (!value) return '<span class="badge badge-unknown">Unknown</span>';
    const val = String(value).toLowerCase();
    if (val === 'yes' || val === 'true') {
        return '<span class="badge badge-valid">Yes</span>';
    } else if (val === 'no' || val === 'false') {
        return '<span class="badge badge-invalid">No</span>';
    }
    return '<span class="badge badge-unknown">Unknown</span>';
}

function viewDetails(index) {
    const item = filteredData[index];
    const modal = document.getElementById('detailModal');
    const modalBody = document.getElementById('modalBody');
    
    if (!modal || !modalBody) return;
    
    modalBody.innerHTML = `
        <h2>${escapeHtml(item.title)}</h2>
        ${item.subtitle ? `<p><em>${escapeHtml(item.subtitle)}</em></p>` : ''}
        
        <div class="detail-section">
            <h3>Basic Information</h3>
            <p><strong>Authors:</strong> ${escapeHtml(item.authors || 'N/A')}</p>
            <p><strong>Date:</strong> ${escapeHtml(item.date || 'N/A')}</p>
            ${item.link || item.code_link ? '<div class="detail-links">' : ''}
                ${item.link ? `<a href="${escapeHtml(item.link)}" target="_blank" class="btn-link">📄 Paper</a>` : ''}
                ${item.code_link ? `<a href="${escapeHtml(item.code_link)}" target="_blank" class="btn-link">💻 Code</a>` : ''}
            ${item.link || item.code_link ? '</div>' : ''}
        </div>
        
        <div class="detail-section">
            <h3>What Does It Evaluate?</h3>
            <p><strong>Purpose:</strong> ${escapeHtml(item.purpose || 'N/A')}</p>
            <p><strong>Principles Tested:</strong> ${escapeHtml(item.principles_tested || 'N/A')}</p>
            <p><strong>Functional Properties:</strong> ${escapeHtml(item.functional_props || 'N/A')}</p>
            <p><strong>Input Modality:</strong> ${escapeHtml(item.input_modality || 'N/A')}</p>
            <p><strong>Output Modality:</strong> ${escapeHtml(item.output_modality || 'N/A')}</p>
        </div>
        
        <div class="detail-section">
            <h3>How Is It Structured?</h3>
            <p><strong>Input Source:</strong> ${escapeHtml(item.input_source || 'N/A')}</p>
            <p><strong>Output Source:</strong> ${escapeHtml(item.output_source || 'N/A')}</p>
            <p><strong>Size:</strong> ${escapeHtml(item.size || 'N/A')}</p>
            <p><strong>Splits:</strong> ${escapeHtml(item.splits || 'N/A')}</p>
            <p><strong>Design:</strong> ${escapeHtml(item.design || 'N/A')}</p>
        </div>
        
        <div class="detail-section">
            <h3>How Does It Work?</h3>
            <p><strong>Judge:</strong> ${escapeHtml(item.judge || 'N/A')}</p>
            <p><strong>Protocol:</strong> ${escapeHtml(item.protocol || 'N/A')}</p>
            <p><strong>Model Access:</strong> ${escapeHtml(item.model_access || 'N/A')}</p>
            <p><strong>Held-out Test:</strong> ${getBadge(item.has_heldout)}</p>
            ${item.heldout_details ? `<p><strong>Held-out Details:</strong> ${escapeHtml(item.heldout_details)}</p>` : ''}
        </div>
        
        <div class="detail-section">
            <h3>Quality & Reliability</h3>
            <p><strong>Alignment Validation:</strong> ${escapeHtml(item.alignment_validation || 'N/A')}</p>
            <p><strong>Construct Validity:</strong> ${getBadge(item.is_valid)}</p>
        </div>
        
        <div class="detail-section">
            <h3>Baselines & Robustness</h3>
            <p><strong>Baseline Models:</strong> ${escapeHtml(item.baseline_models || 'N/A')}</p>
            <p><strong>Robustness Measures:</strong> ${escapeHtml(item.robustness_measures || 'N/A')}</p>
            <p><strong>Known Limitations:</strong> ${escapeHtml(item.known_limitations || 'N/A')}</p>
        </div>
        
        ${item.benchmarks_list ? `
            <div class="detail-section">
                <h3>Related Benchmarks</h3>
                <p>${escapeHtml(item.benchmarks_list)}</p>
            </div>
        ` : ''}
    `;
    
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('detailModal');
    if (modal) modal.style.display = 'none';
}

function exportToCSV() {
    if (filteredData.length === 0) {
        alert('No data to export');
        return;
    }
    
    const headers = allColumns.join(',');
    const rows = filteredData.map(item => {
        return allColumns.map(col => {
            let value = item[col] || '';
            value = String(value).replace(/"/g, '""');
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                value = `"${value}"`;
            }
            return value;
        }).join(',');
    }).join('\n');
    
    const csv = headers + '\n' + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `evaluation_cards_filtered_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===== INITIALIZE EVERYTHING =====
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initThemeToggle();
    
    const form = document.getElementById('evaluationForm');
    if (form) {
        initializeForm();
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        initializeExplorer();
    }
});
