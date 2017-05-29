const thIndex = 8;
const rateMyProfSearchURL = "https://www.ratemyprofessors.com/search.jsp?queryBy=teacherName";
const schoolQuery = "&schoolName=university+of+western+ontario";

function addRatingsButtonToProfCell() {
  let profs = {};
  $("table td:nth-child("+ thIndex +")").each(function(){

    let cell = $(this)[0];
    let cellText = cell.innerText;
    cellText = cellText.replace(/ /g, '');

    if(!isBlank(cellText)) {
      // Make list of unique prof names on page
      if(!profs[cellText]) profs[cellText] = true;

      const profQuery = `&query=${cellText}`;
      let button = $(this)[0];
      button.query = `${rateMyProfSearchURL}${schoolQuery}&queryoption=HEADER${profQuery}&facetSearch=true`;
      button.innerHTML += '<input type="button" value="Show Rating" />';
      button.addEventListener('click', handleRatingRequest);
    }
  });
}

function handleRatingRequest() {

  // Search for a prof at Western to get a list of RMP search results
  $.ajax({
    url: this.query
  }).done( function(response) {
    const firstSearchResult = $(response).find('.PROFESSOR a')[0];
    const profIdQuery = $(firstSearchResult).attr('href');

    // Take the first link to a profs rating page, and get the prof quality  and difficulty.
    $.ajax({
      url: `http://ratemyprofessors.com/${profIdQuery}`
    }).done( function(response) {
      const prof = {
        quality: $(response).find('.quality .grade')[0].innerText,
        difficulty: $(response).find('.difficulty .grade')[0].innerText.trim()
      };

    });
  });
};
