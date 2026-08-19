'use strict'

const accessToken = '';

const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`

    }
};


//Variables
const mediaState = {
    backdrops: [],
    videos: [],
    posters: [],
    popular: []
}

//Filter
const currentFilters = {
    sortBy: 'popularity.desc',
    genre: '',
    minRating: '',
    year: '',
    language: ''
}

const currentFiltersTv = {
    sortBy: 'popularity.desc',
    genre: '',
    minRating: '',
    year: '',
    language: ''
}

// DOM
const moviePageContainer = document.querySelector('.page-container')
const movieGrid = document.querySelector('.movies-grid')
const tvGrid = document.querySelector('.tv-grid')
const totalPages = 50;
const seenMovie = new Set();
const seenTV = new Set();
const genre = document.querySelector('.genres');

let currentFetchController = null;

let numberOfPages = 0



//Infinite scrolling
let currentPage = 1;
let isLoading = false;
let pagePause = 5;
const loadButton = document.getElementById('load-more-btn');
const sentinel = document.getElementById('scroll-sentinel');


const checkSentinel = function () {
    if (!sentinel || isLoading || currentPage >= totalPages) return;

    const rect = sentinel.getBoundingClientRect();
    const inView = rect.top < window.innerHeight + 300; // mirrors your rootMargin
    if (numberOfPages <= currentPage) return;
    if (inView) {

        if (currentPage < pagePause) {
            currentPage++;
            fetchMovies(currentPage).then(checkSentinel); // recheck after render
        } else {
            if (loadButton) loadButton.style.display = 'block';
        }
    }
};


const observerOptions = {
    root: null,
    rootMargin: '300px', // Loads 300px BEFORE reaching the bottom of the page
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    // const entry = entries[0]
    // console.log("entry", entry);
    entries.forEach(entry => {
        if (entry.isIntersecting)
            checkSentinel();
    });

},
    observerOptions
);

if (sentinel) observer.observe(sentinel);

if (loadButton) {
    loadButton.addEventListener('click', function () {
        loadButton.style.display = 'none';
        currentPage++
        pagePause += 5;
        fetchMovies(currentPage)

    });

}

const handleFilter = function () {
    if (currentFetchController) {
        currentFetchController.abort();
    }
    currentFetchController = new AbortController();

    if (movieGrid) movieGrid.innerHTML = '';
    seenMovie.clear();
    currentPage = 1;
    if (loadButton) loadButton.style.display = 'none';
    pagePause = 5


    fetchMovies(currentPage).then(checkSentinel)
}

// const minVotes = currentFilters
//Movies
const fetchMovies = async function (page = 1) {

    if (isLoading) return
    isLoading = true;

    const signal = currentFetchController ? currentFetchController.signal : undefined;
    // console.log("Signal", signal)
    try {
        const isArabic = currentFilters.language === "ar";

        const minVote = isArabic ? 5 : 30;
        const effectiveMinRating = currentFilters.minRating || (isArabic ? '5.5' : '');

        let movieUrl = `https://api.themoviedb.org/3/discover/movie?sort_by=${currentFilters.sortBy}&page=${page}&vote_count.gte=${minVote}&include_adult=false`;
        // const effective

        if (currentFilters.genre) {
            movieUrl += `&with_genres=${currentFilters.genre}`;
        }
        if (currentFilters.year) {
            movieUrl += `&primary_release_year=${currentFilters.year}`;
        }
        if (currentFilters.minRating) {
            movieUrl += `&vote_average.gte=${effectiveMinRating}`;
        }
        if (currentFilters.language) {
            movieUrl += `&with_original_language=${currentFilters.language}`;
        }


        const res = await fetch(movieUrl, { ...options, signal });
        if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
        const movieData = await res.json();


        if (!movieData) return;

        numberOfPages = movieData.total_pages
        movieData.results.forEach(item => {
            if (!item.poster_path) return
            if (seenMovie.has(item.id)) return
            seenMovie.add(item.id)
            const link = document.createElement('a');
            link.href = `movie-details.html?id=${item.id}`
            link.classList.add('poster-link');
            const image = document.createElement('img');
            image.src = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
            image.alt = item.title;
            link.append(image);

            if (movieGrid) movieGrid.append(link);

        })

        console.log(movieData)


        // })

    } catch (err) {
        if (err.name === 'AbortError') {
            console.log('Fetch aborted due to filter change.');
            return;
        }
        console.error(`Something went wrong: ${err.message}`)
    } finally {
        isLoading = false;
    }
}

if (movieGrid) fetchMovies(currentPage).then(checkSentinel);


//Genre fetch
const genresMovies = async function () {
    const genreSelect = document.querySelector('#genre-select');

    if (!genreSelect) return;
    try {
        const genreRes = await fetch(`https://api.themoviedb.org/3/genre/movie/list`, options);
        const genreData = await genreRes.json();

        // console.log("Genre Data", genreData)
        genreData.genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            genreSelect.append(option);
        })
    } catch (err) {
        console.log(`Something went wrong: ${err.message}`)
    }

}
genresMovies();


// Movies Filter Apply
document.querySelector('#select-sort')?.addEventListener('change', function (e) {
    e.preventDefault();
    currentFilters.sortBy = e.target.value;
    handleFilter();

})

document.querySelector('#year-sort')?.addEventListener('change', function (e) {
    currentFilters.year = e.target.value;
    handleFilter();
})

document.querySelector('#genre-select')?.addEventListener('change', function (e) {
    currentFilters.genre = e.target.value;
    handleFilter();
});

document.querySelector('#rating-select')?.addEventListener('change', function (e) {
    currentFilters.minRating = e.target.value;
    handleFilter();
});

document.querySelector('#language-select')?.addEventListener('change', function (e) {
    currentFilters.language = e.target.value;
    handleFilter();
});





// ----------------TV Shows--------------
const tvBtn = document.getElementById('tv-load-btn');
const tvsentinel = document.getElementById('scroll-sentinel-tv');
let currentTvPage = 1;
let tvTotalPages = 60;
let isTvLoading = false;
let tvPagePause = 5;
let numberOfTvPages = 0
let currentFetchControllerTv = null;

const checkSentinelTv = function () {
    if (!tvsentinel || isTvLoading || currentTvPage >= tvTotalPages) return;

    const rect = tvsentinel.getBoundingClientRect();
    const inView = rect.top < window.innerHeight + 300; // mirrors your rootMargin
    if (numberOfTvPages <= currentTvPage) return;
    if (inView) {

        if (currentTvPage < tvPagePause) {
            currentTvPage++;
            tvImage(currentTvPage).then(checkSentinelTv); // recheck after render
        } else {
            if (tvBtn) tvBtn.style.display = 'block';
        }
    }
};


const observerTv = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting)
            checkSentinelTv();
    });

},
    observerOptions
);

if (tvsentinel) observerTv.observe(tvsentinel)

if (tvBtn) {
    tvBtn.addEventListener('click', function () {
        tvBtn.style.display = 'none';
        currentTvPage++
        tvPagePause += 5;
        tvImage(currentTvPage)

    });

}

const handleFilterTv = function () {


    if (currentFetchControllerTv) {
        currentFetchControllerTv.abort();
    }
    currentFetchControllerTv = new AbortController();

    if (tvGrid) tvGrid.innerHTML = '';
    seenTV.clear();
    currentTvPage = 1;
    if (tvBtn) tvBtn.style.display = 'none';
    tvPagePause = 5


    tvImage(currentTvPage).then(checkSentinelTv)
}

const tvImage = async function (page = 1) {


    if (isTvLoading) return
    isTvLoading = true;

    const signal = currentFetchControllerTv ? currentFetchControllerTv.signal : undefined;

    try {

        const isArabic = currentFiltersTv.language === "ar";
        const minVote = isArabic ? 2 : 50;

        const effectiveRating = currentFiltersTv.minRating || (isArabic ? '5.5' : '');
        if (!tvGrid) throw new Error("Movies is currenlty displayed")
        let tvUrl = `https://api.themoviedb.org/3/discover/tv?sort_by=${currentFiltersTv.sortBy}&page=${page}&vote_count.gte=${minVote}&include_adult=false`;


        if (currentFiltersTv.genre) {
            tvUrl += `&with_genres=${currentFiltersTv.genre}`;
        }
        if (currentFiltersTv.year) {
            tvUrl += `&primary_release_year=${currentFiltersTv.year}`;
        }
        if (currentFiltersTv.minRating) {
            tvUrl += `&vote_average.gte=${effectiveRating}`;
        }
        if (currentFiltersTv.language) {
            tvUrl += `&with_original_language=${currentFiltersTv.language}`;
        }



        const tvRes = await fetch(tvUrl, { ...options, signal });
        if (!tvRes.ok) throw new Error(`HTTP response went wrong: ${tvRes.status}`)
        const tvData = await tvRes.json();
        console.log("TV Data", tvData);

        numberOfTvPages = tvData.total_pages;

        tvData.results.forEach(item => {
            if (!item.poster_path) return;
            if (seenTV.has(item.id)) return
            seenTV.add(item.id);
            const link = document.createElement('a');
            link.href = `tv-details.html?id=${item.id}`;
            link.classList.add('poster-link');
            const image = document.createElement('img');
            image.src = `https://image.tmdb.org/t/p/w500${item.poster_path}`
            image.alt = item.title
            link.append(image)
            tvGrid.append(link);

        })

    } catch (err) {
        console.error(` ${err.message}`)
    } finally {
        isTvLoading = false;
    }
}


if (tvGrid) {
    tvImage().then(checkSentinelTv);
}


const genresTv = async function () {
    const genreSelect = document.querySelector('#tv-genre-select');
    if (!genreSelect) return;
    try {
        const genreRes = await fetch(`https://api.themoviedb.org/3/genre/tv/list`, options);
        const genreData = await genreRes.json();

        // console.log("Genre Data", genreData)
        genreData.genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            genreSelect.append(option);
        })
    } catch (err) {
        console.log(`Something went wrong: ${err.message}`)
    }

}

genresTv();
// TV Shows Filter Apply
document.querySelector('#tv-select-sort')?.addEventListener('change', function (e) {
    e.preventDefault();
    currentFiltersTv.sortBy = e.target.value;
    handleFilterTv();

})

document.querySelector('#tv-year-sort')?.addEventListener('change', function (e) {
    currentFiltersTv.year = e.target.value;
    handleFilterTv();
})

document.querySelector('#tv-genre-select')?.addEventListener('change', function (e) {
    currentFiltersTv.genre = e.target.value;
    handleFilterTv();
});

document.querySelector('#tv-rating-select')?.addEventListener('change', function (e) {
    currentFiltersTv.minRating = e.target.value;
    handleFilterTv();
});

document.querySelector('#tv-language-select')?.addEventListener('change', function (e) {
    currentFiltersTv.language = e.target.value;
    handleFilterTv();
});


// --------------- Details Page -------------------------

//Image URL Function
const imageUrl = (path, size = 'original') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : 'placeholder.jpg';



// DOM Function
const backdropImageTv = document.querySelector('.backdrop-tv')
const backdropImage = document.querySelector('.backdrop');
const posterImage = document.querySelector('.poster');
const actorsContainer = document.querySelector('.cast-list');
const status = document.querySelector('.status');
const releaseYear = document.querySelector('#release-year')
if (posterImage) posterImage.classList.add('hidden');
const cerEl = document.querySelector('#movie-certification')
const runTime = document.querySelector('#runtime')
const tagline = document.querySelector('.tagline')
const overview = document.querySelector('.overview')
const title = document.querySelector('#title')


const renderDetails = function (movie) {

    if (title) title.textContent = movie.title;

    const rating = document.querySelector('#movie-rating')
    if (rating) rating.textContent = movie.vote_average.toFixed(1) || "N/A";


    if (releaseYear) releaseYear.textContent = movie.release_date.split('-')[0];

    //Certificate
    const relDates = movie.release_dates?.results?.find(item => item.iso_3166_1 === movie.origin_country[0])
    const certificate = relDates?.release_dates?.find(cer => cer.certification != '')?.certification;


    if (cerEl) cerEl.textContent = certificate || 'N/A';


    if (runTime) runTime.textContent = (movie.runtime / 60).toFixed(0) + "h" + ' ' + (movie.runtime % 60) + "m";

    if (tagline) tagline.textContent = movie.tagline || "";

    if (overview) overview.textContent = movie.overview || "";




    const movieReleaseDate = movie.release_date;

    if (!movieReleaseDate) {
        document.querySelector('#tab-title').textContent = `${movie.title}`;
    } else {
        document.querySelector('#tab-title').textContent = `${movie.title} (${movie.release_date.split('-')[0]})`;
    }

    const movieLanguage = formatedLanguage(movie.original_language)


    //Genre pills
    if (genre) {
        genre.innerHTML = '';
        movie.genres.forEach(el => {
            const pill = document.createElement('span');
            pill.classList.add('genre-pill');
            pill.textContent = el.name
            genre.append(pill)
        });

    }



    //Cast
    if (actorsContainer) {
        const actors = movie.credits?.cast?.slice(0, 9) || [];

        actorsContainer.innerHTML = '';

        actors.forEach(act => {
            const attore = document.createElement('div');
            attore.classList.add('cast-member');

            const profileImage = imageUrl(act.profile_path, 'w185');

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

    }
    //--------Crew---------
    //Writers
    const writing = movie.credits?.crew?.filter(dep => dep.department === "Writing") || [];

    const uniqueNames = writing?.filter((person, index, arr) => arr.findIndex(p => p.id === person.id) === index);
    const writerNames = uniqueNames.map(na => na.name).join(', ')

    document.querySelector('#writer-span').textContent = writerNames || "N/A";

    //Directors
    const director = movie.credits?.crew?.filter(d => d.job === "Director") || [];

    const uniqueDirectors = director.filter(
        (person, index, arr) => arr.findIndex(p => p.id === person.id) === index);

    const directorNames = uniqueDirectors.map(n => n.name).join(', ');
    document.querySelector('#director-span').textContent = directorNames || "N/A";


}



const creatorTv = document.querySelector('#creator-span');
const ratingTv = document.querySelector('#rating-tv');
//-------Rrender TV Shows------------
const isTv = window.location.pathname.includes('tv-details.html');
const dota = document.querySelector('.dot-time');
const seasonScroller = document.querySelector('.season-scroller');


console.log(isTv)
const renderDetailsTv = function (tv) {
    if (!tv || tv.success == false) return;
    console.log("Hello")
    posterImage.src = imageUrl(tv.poster_path);
    posterImage.classList.remove('hidden')

    const creator = tv.created_by.map(create => create.name).join(', ');
    creatorTv.textContent = creator || "N/A";
    ratingTv.textContent = tv.vote_average.toFixed(1);


    if (genre) {
        genre.classList.remove('hidden')
        genre.innerHTML = '';
        tv.genres.forEach(el => {
            const pill = document.createElement('span');
            pill.classList.add('genre-pill');
            pill.textContent = el.name
            genre.append(pill);
        })
    }

    //release year
    function releaseYearRage(tv) {
        if (!tv.first_air_date) {
            releaseYear.textContent = "N/A";
            return;
        }

        const startYear = tv.first_air_date.split('-')[0];
        const isEnded = tv.status === "Ended" || tv.status === "Canceled";

        if (isEnded) {
            const endYear = tv.last_air_date ? tv.last_air_date.split('-')[0] : 'Unknown';

            if (!endYear || startYear === endYear) {
                releaseYear.textContent = `${startYear}`;
                return;
            }
            releaseYear.textContent = `${startYear} – ${endYear}`;
            return;

        }
        releaseYear.textContent = `${startYear} –`;
        return;
    }

    releaseYearRage(tv)


    //certification
    const rating = tv.content_ratings?.results || [];
    const certification = rating?.find(c => c.iso_3166_1 === tv.origin_country[0]) || rating?.find(c => c.iso_3166_1 === 'US') || rating[0];
    cerEl.textContent = certification?.rating || "N/A";


    //runtime
    let runTimes = tv.episode_run_time[0];
    if (!runTimes) {
        runTimes = tv.last_episode_to_air?.runtime || tv.next_episode_to_air?.runtime
    }

    if (runTimes) {
        runTime.textContent = `${runTimes}m`;
    } else {
        runTime.style.display = 'none';
        dota.style.display = 'none';
    }


    if (trailerButton) trailerButton.classList.remove('hidden');

    if (status) {
        document.querySelector('.date-span').textContent = formatedDate(tv.first_air_date, tv.origin_country[0])
        status.classList.remove('hidden')
    }


    tagline.textContent = tv.tagline;
    overview.textContent = tv.overview;

    if (actorsContainer) {
        const actors = tv.credits?.cast?.slice(0, 9) || [];
        actorsContainer.innerHTML = '';

        actors.forEach(act => {
            const attore = document.createElement('div');
            attore.classList.add('cast-member');

            const profileImage = imageUrl(act.profile_path, 'w185');

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

    };

    document.querySelector('.language-span').textContent = formatedLanguage(tv.original_language);

    if (title) title.textContent = tv.original_name;

    document.querySelector('.next-episode').textContent = nextEpisode(tv.next_episode_to_air?.air_date);


    //number of episodes
    const totalEpisodes = tv.seasons?.reduce((acc, curr) => {
        return curr.season_number > 0 ? acc + curr.episode_count : acc;
    }, 0) || 0;

    document.querySelector('.total-episodes-span').textContent = totalEpisodes


    //networks
    const netSpan = document.querySelector('.networks');
    const network = tv.networks?.map(net => net.name).join(', ');
    if (network) {
        document.querySelector('.networks-span').textContent = network;
    } else {
        netSpan.style.display = 'none';
    };




}



const renderSeasonBtn = function (tv) {
    seasonScroller.innerHTML = '';
    tv.seasons.forEach(sea => {

        if (sea.season_number === 0) return
        const seasonBtn = document.createElement('button');
        seasonBtn.classList.add('season-btn');
        seasonBtn.textContent = `S${sea.season_number}`

        seasonBtn.addEventListener('click', () => {
            seasonNumber(sea.id, sea.season_number)

        })
        seasonScroller.append(seasonBtn);
    });

}

const seasonepi = document.querySelector('.season-episodes');


const seasonBtn = document.querySelector('.season-btn');
const seasonEpi = document.querySelector('.season-episodes');

// seasonBtn.addEventListener('click', function () {

// })
// //seasons link
const seasonNumber = async function (tvId = 113962, season = 1) {
    const seasonUrl = `https://api.themoviedb.org/3/tv/${tvId}/season/${season}`
    const seasonRes = await fetch(seasonUrl, options);
    const seasonData = await seasonRes.json();
    console.log("season data", seasonData);

}
// seasonNumber()

//Fomrated Date Function
const MONTHS = {
    '01': 'January', '02': 'February', '03': 'March', '04': 'April',
    '05': 'May', '06': 'June', '07': 'July', '08': 'August',
    '09': 'September', '10': 'October', '11': 'November', '12': 'December'
};

const formatedDate = function (date, origin) {
    if (!date)
        return "N/A"

    const [year, month, day] = date.split('-');

    const monthNum = MONTHS[month] || month;

    const country = new Intl.DisplayNames(['en'], { type: 'region' })

    try {
        return `${monthNum} ${day}, ${year} (${country.of(origin)})`
    } catch (e) {
        country.toUpperCase();
    }

}

//Next Episode
const nextEpisode = function (date) {
    if (!date) {
        document.querySelector('.episode').style.display = 'none'
        return;
    }
    const [year, month, day] = date.split('-');

    const monthNum = MONTHS[month] || month;

    const country = new Intl.DisplayNames(['en'], { type: 'region' })

    try {
        return `${monthNum} ${day}, ${year}`
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
        poster: imageUrl(movie.poster_path || movie.profile_path || 'placeholder.jpg')

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


if (status) status.classList.add('hidden')


const spans = function (movie) {
    posterImage.src = imageUrl(movie.poster_path);
    posterImage.alt = `${movie.original_title} Poster`;

    document.querySelector('.date-span').textContent = formatedDate(movie.release_date, movie.origin_country[0]);
    document.querySelector('.language-span').textContent = formatedLanguage(movie.original_language);
    document.querySelector('.budget-span').textContent = formatedCurrency(movie.budget) || "N/A";
    document.querySelector('.revenue-span').textContent = formatedCurrency(movie.revenue) || "N/A";

    posterImage.onload = function () {
        posterImage.classList.remove('hidden');
        status.classList.remove('hidden');
        trailerButton.classList.remove('hidden');
        genre.classList.remove('hidden');
    };
};

//----Media assets fetch
const mediaAsset = async function (movieId) {
    const mediaType = isTv ? 'tv' : 'movie';
    const imagesUrl = `https://api.themoviedb.org/3/${mediaType}/${movieId}/images`;
    const videosUrl = `https://api.themoviedb.org/3/${mediaType}/${movieId}/videos`;

    try {
        const [imageRes, videoRes] = await Promise.all([
            fetch(imagesUrl, options),
            fetch(videosUrl, options)
        ]);

        const imageData = await imageRes.json();
        const videoData = await videoRes.json();

        console.log("ImageData", imageData)
        console.log("VideoData", videoData)

        mediaState.backdrops = imageData.backdrops || [];
        mediaState.posters = imageData.posters || [];
        mediaState.videos = videoData.results || [];


    } catch (err) {
        console.error(`Error fetching media assets: ${err.message}`);
    }
}


const media = document.querySelector('.media-scroll')


//Render Backdrops
const createBackdrops = function (backdrop, limit = 10) {

    return backdrop.slice(0, limit).map(back => {
        const img = document.createElement('img');
        img.classList.add('media-container');
        img.src = imageUrl(back.file_path, 'w780')
        img.alt = "Backdrop";
        console.log("Img", img);
        return img;
    });

};

//Render Videos
const createVideos = function (videos, limit = 6) {
    // console.log(filtered)
    return videos.slice(0, limit).map(video => {
        const vid = document.createElement('iframe')
        vid.classList.add('media-container')
        vid.src = `https://www.youtube.com/embed/${video.key}`;

        vid.allowFullscreen = true;
        vid.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        vid.style.border = "none"; // Clean edge styling
        vid.title = video.name;
        return vid;
    });
}

console.log("Create Videos", createVideos(mediaState.videos))



const renderBackdrops = function (backdrops) {
    media.innerHTML = '';
    createBackdrops(backdrops).forEach(back => media.append(back));
}

const renderVideos = function (vids) {
    media.innerHTML = '';
    createVideos(vids).forEach(vid => media.append(vid))
}



const renderPopular = function () {
    media.innerHTML = '';
    const popularVids = createVideos(mediaState.videos, 1);
    const backdrops = createBackdrops(mediaState.backdrops, 2);
    const popularPosters = createBackdrops(mediaState.posters, 1);
    const all = [...popularVids, ...backdrops, ...popularPosters]

    all.forEach(el => media.append(el));
    mediaState.popular = all;



}

//Media nav bar
const mediaButtons = document.querySelectorAll('.media-nav button');

const setActive = function (clickedBtn) {
    mediaButtons.forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active')
}







// -------- Main details page API ----------
const detailsImage = async function () {

    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id') || '4232'

    if (isTv) {
        const tvUrl = `https://api.themoviedb.org/3/tv/${movieId}?append_to_response=credits,content_ratings`;
        const tvRes = await fetch(tvUrl, options);
        const tvData = await tvRes.json();
        console.log("TV Data", tvData)
        // const seasonUrl = `https://api.themoviedb.org/3/tv/${tvId}/season/${season}`
        // const seasonRes = await fetch(seasonUrl, options);
        // const seasonData = await seasonRes.json();
        if (backdropImageTv) {
            backdropImageTv.src = imageUrl(tvData.backdrop_path)
            backdropImageTv.alt = `${tvData.name} Backdrop`;
            document.querySelector('.ambient-glow').style.setProperty('--glow-image', `url(${imageUrl(tvData.backdrop_path)})`)
        }
        renderDetailsTv(tvData)
        await mediaAsset(movieId)
        renderPopular();
        setActive(mostPopular);

        renderSeasonBtn(tvData);

    } else {
        const moviesUrl = `https://api.themoviedb.org/3/movie/${movieId}?append_to_response=release_dates,credits`;
        const movieRes = await fetch(moviesUrl, options)

        const movieData = await movieRes.json();
        console.log(movieData)

        const images = formatedImage(movieData)
        // console.log(images)

        if (backdropImage) {
            backdropImage.src = images.backdrop
            backdropImage.alt = `${movieData.title} Backdrop`;
            document.querySelector('.ambient-glow').style.setProperty('--glow-image', `url(${images.backdrop})`)

        }
        renderDetails(movieData);
        spans(movieData)
        await mediaAsset(movieId);
        renderPopular();
        setActive(mostPopular);
    }
}

const btnBackdrops = document.querySelector('.btn-backdrops');
const posters = document.querySelector('.btn-posters');
const videos = document.querySelector('.btn-videos');

const mostPopular = document.querySelector('.btn-popular');


if (btnBackdrops) {
    btnBackdrops.addEventListener('click', function () {
        renderBackdrops(mediaState.backdrops)
        setActive(btnBackdrops);
    })
}

if (posters) {
    posters.addEventListener('click', function () {
        media.innerHTML = '';

        renderBackdrops(mediaState.posters);
        setActive(posters);

    })
}

if (videos) {
    videos.addEventListener('click', function () {
        media.innerHTML = '';
        renderVideos(mediaState.videos);
        setActive(videos);



    })
}

if (mostPopular) {

    mostPopular.addEventListener('click', function () {
        media.innerHTML = '';

        renderPopular();
        setActive(mostPopular);

    })
}


//Modal DOM
const trailerButton = document.querySelector('.btn-trailer');
const modal = document.querySelector('.modal');
const modalContent = document.querySelector('.modal-content');
const overlay = document.querySelector('.overlay');
// const trailerFrame = document.querySelector('.trailer-frame');
const btnCloseModal = document.querySelector('.close-modal');


const openTrailer = function (vidkey) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${vidkey.key}?autoplay=1`;
    iframe.classList.add('trailer-frame');
    iframe.allowFullscreen = true;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    modalContent.querySelector('.trailer-frame')?.remove();
    modalContent.append(iframe);
    modal.classList.remove('hidden')
}


if (trailerButton) {

    trailerButton.addEventListener('click', function () {

        const mainTrailer = mediaState.videos.find(trail => trail.site === "YouTube" && trail.name === "Official Trailer" && trail.official === true) || mediaState.videos.find(trail => trail.site === "YouTube" && trail.official === true && trail.type === "Trailer") || mediaState.videos.find(trail => trail.site === "YouTube" && trail.type === "Trailer") || mediaState.videos.find(trail => trail.site === "YouTube" && trail.type === "Teaser");

        if (mainTrailer) {
            openTrailer(mainTrailer)

        } else {
            alert("No trailer found")
        }

    });
}

const closeModal = function () {
    modal.classList.add('hidden');
    modalContent.querySelector('.trailer-frame')?.remove();
}

if (btnCloseModal && overlay) {

    btnCloseModal.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
}

if (modalContent) {

    modalContent.addEventListener('click', function (e) {
        e.stopPropagation();
    })
}

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
    }
})

window.addEventListener('pagehide', function () {
    if (!modal.classList.contains('hidden')) {
        closeModal();
    }
})
detailsImage();

