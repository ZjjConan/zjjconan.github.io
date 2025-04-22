class PublicationApp {
  constructor() {
    this.citationManager = new CitationManager();
    this.publicationView = new PublicationView();
  }

  async initialize() {
    try {
      await this.citationManager.loadBibtex('materials/publications.bib');
      const allPublications = this.citationManager.getAllPublications();
      const sortedPublications = this.sortPublications(allPublications);
      this.publicationView.renderPublications(sortedPublications);
      this.publicationView.setupFilters();
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
    
    publications.forEach(entry => {
      const pubElement = document.createElement('div');
      pubElement.className = `pub-item ${entry.type}`;
      pubElement.setAttribute('data-category', entry.type);
      pubElement.innerHTML = this.generatePublicationHTML(entry);
      container.appendChild(pubElement);
    });

    if (typeof MathJax !== 'undefined') {
      MathJax.typesetPromise();
    }
  }

  generatePublicationHTML(entry) {
    let thumbnailHTML = '';
    // The following will include thumbnail image for every pub-entry
    // if (entry.thumbnail) {
    //     thumbnailHTML = `<img src="${entry.thumbnail}" class="pub-thumbnail" alt="Publication thumbnail">`;
    // }
    let html = `
        <div class="pub-container">
            ${thumbnailHTML}
            <div class="pub-content">
                <div class="pub-title">${this.renderLatex(entry.title || 'Untitled')}</div>
                <div class="pub-authors">${this.formatAuthors(entry.author)}</div>
    `;
    
    if (entry.journal) {
      html += `<div class="pub-venue"><i>${this.renderLatex(entry.journal)}</i>`;
      if (entry.journal_abbre) html += ` (<b>${entry.journal_abbre}</b>)`;
      if (entry.volume) html += `, ${entry.volume}`;
      if (entry.number) html += `(${entry.number})`;
      if (entry.pages) html += `, pp. ${entry.pages}`;
      if (entry.year) html += `, ${entry.year}`;
      html += `</div>`;
    } else if (entry.booktitle) {
      html += `<div class="pub-venue"><i>${this.renderLatex(entry.booktitle)}</i>`;
      if (entry.booktitle_abbre) html += ` (<b>${entry.booktitle_abbre}</b>)`;
      if (entry.year) html += `, ${entry.year}`;
      html += `</div>`;
    }
    
    html += `<div class="pub-links">`;
    if (entry.url) html += `<a href="${entry.url}" target="_blank"><b>PDF</b></a> `;
    // if (entry.doi) html += `<a href="https://doi.org/${entry.doi}" target="_blank">DOI</a> `;
    if (entry.webpage) html += `<a href="${entry.webpage}" target="_blank"><b>Webpage</b></a> `;
    if (entry.code) html += `<a href="${entry.code}" target="_blank"><b>Code</b></a> `;
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
      // Trim whitespace and handle "Last, First" or "First Last" formats
      author = author.trim();
      
      // Check for comma format (Yang, Lingxiao)
      if (author.includes(',')) {
        const [lastName, firstName] = author.split(',').map(part => part.trim());
        author = `${firstName} ${lastName}`;
      }
      
      // Bold the author if it's Lingxiao Yang in any format
      if (author.match('Lingxiao Yang|Yang Lingxiao')) {
        return '<b>' + author + '</b>';
      }
      
      return author;
    }).join(', ');
  }

  setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        const filter = this.getAttribute('data-filter');
        document.querySelectorAll('.pub-item').forEach(pub => {
          pub.style.display = (filter === 'all' || pub.getAttribute('data-category') === filter) 
            ? 'block' 
            : 'none';
        });
      });
    });
  }
}