class PublicationApp {
  constructor() {
    this.citationManager = new CitationManager();
    this.publicationView = new PublicationView();
    this.allPublications = [];
  }

  async initialize() {
    try {
      await this.citationManager.loadBibtex('materials/publications.bib');
      this.allPublications = this.citationManager.getAllPublications();
      const sortedPublications = this.sortPublications(this.allPublications);
      this.publicationView.renderPublications(sortedPublications);
      this.publicationView.setupFilters(sortedPublications, (filtered) => {
        this.publicationView.renderPublications(filtered);
      });
    } catch (error) {
      console.error('Error:', error);
      document.getElementById('publications').innerHTML = 
        '<p>Error loading publications. Please try again later.</p>';
    }
  }

  sortPublications(publications) {
    return [...publications].sort((a, b) => (b.year || '0') - (a.year || '0'));
  }
}

class CitationManager {
  constructor() {
    this.publications = {};
  }

  async loadBibtex(bibtexFile) {
    const response = await fetch(bibtexFile);
    const bibtex = await response.text();
    this.parseBibtex(bibtex);
  }

  parseBibtex(bibtex) {
    const entryRegex = /@(\w+)\{([^,]+),\s*([^@]*)\}/g;
    let match;
    
    while ((match = entryRegex.exec(bibtex)) !== null) {
      const type = match[1];
      const key = match[2];
      const fields = match[3];
      
      const entry = { type, key };
      const fieldRegex = /(\w+)\s*=\s*\{([^}]*)\}/g;
      let fieldMatch;
      
      while ((fieldMatch = fieldRegex.exec(fields)) !== null) {
        entry[fieldMatch[1].toLowerCase()] = fieldMatch[2];
      }
      
      this.publications[key] = entry;
    }
  }

  getPublications(keys) {
    return keys.map(key => this.publications[key]).filter(Boolean);
  }

  getAllPublications() {
    return Object.values(this.publications);
  }
}

class PublicationView {
  renderPublications(publications) {
    const container = document.getElementById('publications') || 
                     document.querySelector('.pub-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    publications.forEach((entry, index) => {
      const pubElement = document.createElement('div');
      pubElement.className = `pub-item ${entry.type}`;
      pubElement.setAttribute('data-category', entry.type);
      pubElement.innerHTML = this.generatePublicationHTML(entry, index + 1);
      container.appendChild(pubElement);
    });

    if (typeof MathJax !== 'undefined') {
      MathJax.typesetPromise();
    }
  }

  generatePublicationHTML(entry, index) {
    // 标题：如果有 URL，则用 <a> 包裹标题链接到 PDF
    const title = this.renderLatex(entry.title || 'Untitled');
    let titleHtml;
    if (entry.url) {
      titleHtml = `<a href="${entry.url}" target="_blank">${title}</a>`;
    } else {
      titleHtml = title;
    }
    
    let html = `
        <div class="pub-container">
            <div class="pub-content">
                <div class="pub-title"><span class="pub-number">[${index}]</span> ${titleHtml}</div>
                <div class="pub-authors">${this.formatAuthors(entry.author)}</div>
    `;
    
    // 构建第三行：期刊/会议信息 + Webpage链接 + Code链接
    let venueHtml = '';
    const type = entry.type || '';
    
    if (type === 'article' || entry.journal) {
      // const journal = entry.journal_abbre || entry.journal || '';
      // venueHtml = `<i>${this.renderLatex(journal)}</i>`;
      // if (entry.volume) venueHtml += `, ${entry.volume}`;
      // if (entry.number) venueHtml += `(${entry.number})`;
      // if (entry.pages) venueHtml += `, pp. ${entry.pages}`;
      // if (entry.year) venueHtml += `, ${entry.year}`;
      venueHtml += `<div class="pub-venue"><i>${this.renderLatex(entry.journal)}</i>`;
      if (entry.journal_abbre) venueHtml += ` (<b>${entry.journal_abbre}</b>)`;
      if (entry.volume) venueHtml += `, ${entry.volume}`;
      if (entry.number) venueHtml += `(${entry.number})`;
      if (entry.pages) venueHtml += `, pp. ${entry.pages}`;
      if (entry.year) venueHtml += `, ${entry.year}.`;
      // venueHtml += `</div>`;
    } else if (type === 'inproceedings' || entry.booktitle) {
      // const booktitle = entry.booktitle_abbre || entry.booktitle || '';
      // venueHtml = `in <i>${this.renderLatex(booktitle)}</i>`;
      // if (entry.year) venueHtml += `, ${entry.year}`;
      // if (entry.pages) venueHtml += `, pp. ${entry.pages}`;
      venueHtml += `<div class="pub-venue"><i>${this.renderLatex(entry.booktitle)}</i>`;
      if (entry.booktitle_abbre) venueHtml += ` (<b>${entry.booktitle_abbre}</b>)`;
      if (entry.year) venueHtml += `, ${entry.year}.`;
    } else if (type === 'preprint') {
      venueHtml = `arXiv preprint`;
      if (entry.year) venueHtml += `, ${entry.year}.`;
    }
    
    // 在第三行末尾添加链接：[Webpage] 和 [Code]
    const links = [];
    if (entry.webpage) links.push(`<a href="${entry.webpage}" target="_blank"><b>Project Page</b></a>`);
    if (entry.code) links.push(`<a href="${entry.code}" target="_blank"><b>Code</b></a>`);
    if (links.length > 0) {
      venueHtml += ` [${links.join('] [')}]`;
    }
    
    html += `<div class="pub-venue">${venueHtml}</div>`;
    html += `</div>`;
    
    return html;
  }

  renderLatex(text) {
    if (!text) return '';
    return text
      .replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
      .replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>')
      .replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>')
      .replace(/\\texttt\{([^}]*)\}/g, '<code>$1</code>')
      .replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>')
      .replace(/\\textsuperscript\{([^}]*)\}/g, '<sup>$1</sup>')
      .replace(/\\textsubscript\{([^}]*)\}/g, '<sub>$1</sub>')
      .replace(/\\&/g, '&amp;');
  }

  formatAuthors(authors) {
    if (!authors) return 'Unknown author';
    
    return authors.split('and').map(author => {
      author = author.trim();
      
      if (author.includes(',')) {
        const [lastName, firstName] = author.split(',').map(part => part.trim());
        author = `${firstName} ${lastName}`;
      }
      
      if (author.includes('Lingxiao Yang') || author.includes('Yang Lingxiao')) {
        return '<b>' + author + '</b>';
      }
      
      return author;
    }).join(', ');
  }

  setupFilters(allPublications, onFilter) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        const filter = this.getAttribute('data-filter');
        
        let filtered = allPublications;
        if (filter === 'article') {
          filtered = allPublications.filter(pub => pub.type === 'article');
        } else if (filter === 'inproceedings') {
          filtered = allPublications.filter(pub => pub.type === 'inproceedings');
        } else if (filter === 'preprint') {
          filtered = allPublications.filter(pub => pub.type === 'preprint');
        }
        
        onFilter(filtered);
      });
    });
  }
}