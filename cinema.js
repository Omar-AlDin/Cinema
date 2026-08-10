'use strict'

const accessToken = "YOUR_TMDB_API_KEY_HERE";

const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`

    }
};

// DOM
const movieGrid = document.querySelector('.movies-grid')
const tvGrid = document.querySelector('.tv-grid')
const totalPages = 10;
const seenMovie = new Set();
const seenTV = new Set();

//Movies
const movieImage = async function () {
    try {

        if (!movieGrid) throw new Error("TV Shows are currently displayed")
        // movieGrid.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {

            const movieUrl = `https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&page=${i}`;
            const moviesRes = await fetch(movieUrl, options)

            const movieData = await moviesRes.json();
            // console.log(movieData)

            movieData.results.forEach(item => {
                if (!item.poster_path) return;
                if (seenMovie.has(item.id)) return
                seenMovie.add(item.id)


                // if (item.id.has(seenMovie)) return;
                // else(item.add(item.id))

                // if()
                const image = document.createElement('img');

                // console.log(item);
                image.src = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
                movieGrid.append(image);
            });
        }
    } catch (err) {
        console.error(`${err.message}`)
    }
}



// TV Shows
const tvImage = async function () {
    try {
        if (!tvGrid) throw new Error("Movies is currenlty displayed")
        for (let i = 1; i <= totalPages; i++) {
            const tvUrl = `https://api.themoviedb.org/3/discover/tv?sort_by=popularity.desc&page=${i}`;

            const tvRes = await fetch(tvUrl, options);
            const tvData = await tvRes.json();
            console.log(tvData);
            tvData.results.forEach(item => {
                if (!item.poster_path) return;
                if (seenTV.has(item)) return
                seenTV.add(item);
                const image = document.createElement('img');
                image.src = `https://image.tmdb.org/t/p/w500${item.poster_path}`
                tvGrid.append(image);

            })
        }
    } catch (err) {
        console.error(` ${err.message}`)
    }
}


movieImage();
tvImage();

// --------------- Details Page -------------------------

//Image URL Function
const imageUrl = (path, size = 'original') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : 'placeholder.jpg';



// DOM Function
const backdropImage = document.querySelector('.backdrop');
const posterImage = document.querySelector('.poster');


const renderDetails = function (movie) {

    document.querySelector('#title').textContent = movie.title;
    document.querySelector('#movie-rating').textContent = movie.vote_average.toFixed(1);
    document.querySelector('#release-year').textContent = movie.release_date.split('-')[0];

    //Certificate
    const relDates = movie.release_dates?.results?.find(item => item.iso_3166_1 === movie.origin_country[0])
    const certificate = relDates?.release_dates?.find(cer => cer.certification != '')?.certification;

    document.querySelector('#movie-certification').textContent = certificate || 'N/A';

    document.querySelector('#runtime').textContent = (movie.runtime / 60).toFixed(0) + "h" + ' ' + (movie.runtime % 60) + "m";

    document.querySelector('.tagline').textContent = movie.tagline

    document.querySelector('.overview').textContent = movie.overview

    document.querySelector('.date-span').textContent = formatedDate(movie, movie.origin_country[0]);
    document.querySelector('#tab-title').textContent = `${movie.title} (${movie.release_date.split('-')[0]})`;

    const movieLanguage = formatedLanguage(movie.original_language)

    document.querySelector('.language-span').textContent = movieLanguage;

    //Genre pills
    const genre = document.querySelector('.genres');
    genre.innerHTML = '';
    movie.genres.forEach(el => {
        const pill = document.createElement('span');
        pill.classList.add('genre-pill');
        pill.textContent = el.name
        genre.append(pill)
    });

    document.querySelector('.budget-span').textContent = formatedCurrency(movie.budget) || "N/A";
    document.querySelector('.revenue-span').textContent = formatedCurrency(movie.revenue) || "N/A";


    //Button


    //Cast
    const actors = movie.credits?.cast?.slice(0, 10) || [];

    const actorsContainer = document.querySelector('.cast-list');

    actorsContainer.innerHTML = '';

    actors.forEach(act => {
        const attore = document.createElement('div');
        attore.classList.add('cast-member');

        const profileImage = act.profile_path ? `https://image.tmdb.org/t/p/w185${act.profile_path}` : `placeholder.jpg`;

        attore.innerHTML =
            `<img src=${profileImage} alt="${act.name}" class = "cast-image">
        <h4 class="actor-name">${act.name}</h4>
        <p class="character-name">${act.character}</p>`;

        actorsContainer.append(attore)
    });

    const viewMoreBtn = document.createElement('button');
    viewMoreBtn.classList.add('btn-view-more');
    viewMoreBtn.textContent = "View More →";
    actorsContainer.append(viewMoreBtn);
    //--------Crew---------
    //Writers
    const writing = movie.credits?.crew?.filter(dep => dep.department === "Writing") || [];

    const uniqueNames = writing.filter((person, index, arr) => arr.findIndex(p => p.id === person.id) === index);

    const writerNames = uniqueNames.map(na => na.name).join(', ')

    document.querySelector('#writer-span').textContent = writerNames;

    //Directors
    const director = movie.credits?.crew?.filter(d => d.job === "Director") || [];

    const uniqueDirectors = director.filter(
        (person, index, arr) => arr.findIndex(p => p.id === person.id) === index);

    const directorNames = uniqueDirectors.map(n => n.name).join(', ');
    document.querySelector('#director-span').textContent = directorNames || "N/A";

}

//Fomrated Date Function
const MONTHS = {
    '01': 'January', '02': 'February', '03': 'March', '04': 'April',
    '05': 'May', '06': 'June', '07': 'July', '08': 'August',
    '09': 'September', '10': 'October', '11': 'November', '12': 'December'
};

const formatedDate = function (date, origin) {
    if (!date?.release_date)
        return "N/A"

    const [year, month, day] = date.release_date.split('-');

    const monthNum = MONTHS[month] || month;

    const country = new Intl.DisplayNames(['en'], { type: 'region' })

    try {
        return `${monthNum} ${day}, ${year} (${country.of(origin)})`
    } catch (e) {
        country.toUpperCase();
    }

}

//Formated Currency & Numbers Function
const formatedCurrency = function (curr) {
    if (!curr) return 'N/A';

    const currency = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    });
    return currency.format(curr);
}



//Formated Poster and Backdrop Function
const formatedImage = function (movie) {
    return {
        backdrop: imageUrl(movie.backdrop_path),
        poster: imageUrl(movie.poster_path || profile_path)

    }
}

//Formated Language Function
const formatedLanguage = function (lan) {
    if (!lan) return 'N/A'
    const lang = new Intl.DisplayNames(['en'], { type: 'language' });
    try {
        return lang.of(lan)
    } catch (e) {
        lan.toUpperCase();
    }
}

// -------- Main details page API ----------
const detailsImage = async function () {
    const moviesUrl = `https://api.themoviedb.org/3/movie/603692?append_to_response=release_dates,credits`;
    const movieRes = await fetch(moviesUrl, options)
    const movieData = await movieRes.json();
    console.log(movieData)

    const images = formatedImage(movieData)
    console.log(images)


    backdropImage.src = imageUrl(movieData.backdrop_path)
    posterImage.src = imageUrl(movieData.poster_path)
    renderDetails(movieData)


}

detailsImage();