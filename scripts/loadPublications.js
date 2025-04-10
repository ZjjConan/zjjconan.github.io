// Fetch the .bib file
fetch('materials/publications.bib')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.text();
  })
  .then(data => {
    // Parse the .bib file
    const bib = bibjs.parse(data, 'bibtex');

    // Create a map of bib entries by their keys
    const bibMap = {};
    bib.forEach(entry => {
      bibMap[entry.id] = entry;
    });

    // Find all publication containers with data-bib-key attribute
    const publicationContainers = document.querySelectorAll('.publication[data-bib-key]');

    // Generate HTML for each publication
    publicationContainers.forEach(container => {
      const bibKey = container.getAttribute('data-bib-key');
      const pub = bibMap[bibKey];

      if (pub) {
        const publicationDiv = document.createElement('div');
        publicationDiv.classList.add('publication-content');

        const titleDiv = document.createElement('div');
        titleDiv.classList.add('pub-title');
        titleDiv.textContent = pub.title;
        publicationDiv.appendChild(titleDiv);

        const authorsDiv = document.createElement('div');
        authorsDiv.classList.add('pub-authors');
        authorsDiv.textContent = pub.author;
        publicationDiv.appendChild(authorsDiv);

        const venueDiv = document.createElement('div');
        venueDiv.classList.add('pub-venue');
        venueDiv.textContent = pub.journal || pub.booktitle;
        publicationDiv.appendChild(venueDiv);

        // Add pub-links manually
        const linksDiv = document.createElement('div');
        linksDiv.classList.add('pub-links');
        linksDiv.innerHTML = `
          <a href="https://example.com/paper1.pdf" target="_blank">PDF</a> |
          <a href="https://github.com/user/paper1" target="_blank">Code</a> |
          <a href="https://example.com/paper1-project" target="_blank">Project Page</a>
        `;
        publicationDiv.appendChild(linksDiv);

        container.appendChild(publicationDiv);
      } else {
        console.warn(`Bib entry with key ${bibKey} not found.`);
      }
    });
  })
  .catch(error => {
    console.error('Error loading .bib file:', error);
  });