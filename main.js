const indexOfProfessorColumn = 8;
const professorsCells = `table td:nth-child(${indexOfProfessorColumn})`
const RMPWesternSearchURL = "https://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=university+of+new+mexico";
let profRatingDivs = {};

function main() {
  try {
    addButtonsToTimetable();
  } catch (err) {
    console.log(err)
  }
};

function addButtonsToTimetable(){
  $(professorsCells).each(function(){
    let professorsCell = $(this)[0];
    const textInCell = professorsCell.innerText.replace(/\n/g,  '*');
    const professors = textInCell.split('*').filter(String);
    professorsCell.innerText = '';
    if (professors.length != 0) createChildCellForEachProfessor(professorsCell, professors);

    $(professorsCell).children().each(function() {
      professorCell = this;
      const button = createButton(professorCell, professorCell.innerText);
      this.appendChild(button);
    });
  });
}

function createChildCellForEachProfessor(cell, professors) {
  professors.map( professorName => {
    professorName = professorName.replace(/ /g, '-');
    const professorNameCell = document.createElement('div');
    professorNameCell.innerText = professorName;
    $(professorNameCell).addClass('name-cell');
    cell.appendChild(professorNameCell);
  });
}

function createButton(cell, profName) {
  const profQuery = `&query=${profName}`
  let button =  document.createElement('span');
  button.query = `${RMPWesternSearchURL}&queryoption=HEADER${profQuery}&facetSearch=true`;
  button.clicked = false;
  $(button).addClass('chevron down-chevron');

  button.addEventListener('click', function() {
    const that = this;
    toggleRatingDisplay(that, cell, profName);
  });

  return button;
};

function toggleRatingDisplay(button, cell, profName){
  if (button.clicked) {
    hideRating(button);
  } else {
    fetchRating(button, cell, profName);
  }
};

function hideRating(button) {
  button.clicked = false;
  let ratingDiv = button.parentElement.getElementsByClassName('rating')[0];
  $(ratingDiv).addClass('hidden');
  const errorMessage = button.parentElement.getElementsByClassName('error')[0];
  if (errorMessage) button.parentElement.removeChild(errorMessage);
  $(button).addClass('down-chevron');
}

function fetchRating(button, cell, profName) {
  button.clicked = true;
  let ratingDiv = profRatingDivs[profName];

  if (ratingDiv) {
    showRating(button, cell, ratingDiv);
  } else {
    const loader = createLoaderOn(cell);
    const profSearchURL = button.query;

    retrieveRatingFromRMP(profSearchURL, cell).then( function(profData) {
      cell.removeChild(loader);
      if(!profData) throw `Nobody has rated this prof!`;

      const link = createRmpLink(cell.innerText, profData.url);
      removeTextNodes(cell);
      cell.insertBefore(link, cell.firstChild);
      ratingDiv = createRatingDiv(profData, cell);
      profRatingDivs[profName] = ratingDiv;

      showRating(button, cell, ratingDiv);
    }).catch( function(err) {
      $(button).removeClass('down-chevron');
      createErrorMessage(err, cell, profSearchURL);
    });
  }
}

function showRating(button, cell, ratingDiv) {
  $(button).removeClass('down-chevron');
  const rating = getRatingDiv(cell);
  if (rating) {
    $(rating).removeClass('hidden');
  } else {
    $(ratingDiv).removeClass('hidden');
    const clone = ratingDiv.cloneNode(true);
    cell.appendChild(clone);
  }
}

function getRatingDiv(cell) {
  return $(cell).find('.rating')[0];
}

function createLoaderOn(cell) {
  let loader = document.createElement('div');
  $(loader).addClass('loader');
  cell.appendChild(loader);
  return loader;
}

function retrieveRatingFromRMP(profSearchQuery, cell) {
  let profRatingURL;

  return ajax(profSearchQuery).then( function(profSearchPage) {
    profRatingURL = getProfRatingURL(profSearchPage);
    return ajax(profRatingURL);
  }).then( function(response) {
    const profData = {
      url: profRatingURL,
      quality: $(response).find('.quality .grade')[0].innerText,
      difficulty: $(response).find('.difficulty .grade')[0].innerText.trim(),
      studentRatings: $(response).find('.rating-count')[0].innerText.trim()
    };
    return profData;
  }).catch( function(err) {
    console.log(err);
  });
};

function getProfRatingURL(response) {
    const firstSearchResult = $(response).find('.PROFESSOR a')[0];
    const profIdQuery = $(firstSearchResult).attr('href');
    const profRatingURL = `http://ratemyprofessors.com${profIdQuery}`
    return profRatingURL;
};

function createRatingDiv(profData, element) {
  const {url, quality, difficulty, studentRatings} = profData;
  let ratingsDiv = document.createElement('div');
  $(ratingsDiv).addClass('rating');

  const qualityBarWithHeader = createRatingBarWithHeader(quality, "Quality");
  ratingsDiv.appendChild(qualityBarWithHeader);

  const difficultyBarWithHeader = createRatingBarWithHeader(difficulty, "Difficulty");
  ratingsDiv.appendChild(difficultyBarWithHeader);

  const ratingsCountWithHeader = createRatingsCountDiv(studentRatings);
  ratingsDiv.appendChild(ratingsCountWithHeader);

  return ratingsDiv;
};

function createRatingBarWithHeader(rating, category) {
  const barWithHeader = document.createElement('div');
  barWithHeader.appendChild(createHeader(category));
  barWithHeader.appendChild(createRatingBar(rating));
  return barWithHeader;
}

function createRatingsCountDiv(studentRatings) {
  const ratingsCountDiv = document.createElement('div');
  ratingsCountDiv.appendChild(createHeader('Reviews'));
  const numRatings = getNumberOfRatings(studentRatings);
  let ratingsCounter = document.createElement('div');
  ratingsCounter.innerText = numRatings;
  $(ratingsCounter).addClass('ratings-count rating-container');
  ratingsCountDiv.appendChild(ratingsCounter);
  return ratingsCountDiv;
}

function createHeader(headerText) {
  let header = document.createElement('span');
  header.innerText = headerText;
  $(header).addClass('rating-header');
  return header;
}

function getNumberOfRatings(numRatingsString) {
  return numRatingsString.substr(0, numRatingsString.indexOf(" "));
}

function createRatingBar(ratingString){
  let ratingPercent = parseFloat(ratingString);
      ratingPercent *= 20;
  let container = document.createElement('div');
    $(container).addClass("w3-grey w3-round rating-container");
  let bar = document.createElement('div');
    $(bar).addClass('w3-container w3-center w3-round rating-bar');
    $(bar).css('width', `${ratingPercent}%`);
    bar.innerText = ratingString;
  container.appendChild(bar);
  return container;
}

function createRmpLink(name, url) {
  let link = document.createElement('a');
    $(link).addClass('rmp-link');
    link.href = url;
    link.innerText = name;
    link.target = "_blank";
  return link;
}

function removeTextNodes(element) {
  $(element).contents().filter(function() {
      return this.nodeType===3;
  }).remove();
}

function createErrorMessage(message, cell, searchURL) {
  const err = document.createElement('a');
    err.href = searchURL;
    err.innerText = message;
    err.target = '_blank';
    $(err).addClass('error');
  cell.appendChild(err);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function isNotBlank(str) {
    return !(!str || /^\s*$/.test(str));
}

function ajax(url) {
  return new Promise(function(resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      resolve(this.responseText);
    };
    xhr.onerror = reject;
    xhr.open('GET', url);
    xhr.send();
  });
}

main();
