// Contenu textuel des projets, repris de l'ancienne version Angular.
// Les chemins d'images sont relatifs à ASSETS (le dossier assets/ à la racine du repo).
export const ASSETS = '../assets/';

const img = (src, caption) =>
  `<figure class="solo"><img src="${ASSETS}${src}" alt="${caption}" loading="lazy"><figcaption>${caption}</figcaption></figure>`;
const gallery = (srcs, caption) =>
  `<figure class="multi"><div class="gallery">${srcs
    .map((s) => `<img src="${ASSETS}${s}" alt="${caption}" loading="lazy">`)
    .join('')}</div><figcaption>${caption}</figcaption></figure>`;

export const PROFILE = {
  name: 'Thomas',
  role: 'Fullstack developer',
  socials: [
    { label: 'GitHub', href: 'https://github.com/TGuesdon', icon: 'github' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/thomas-guesdon-b025b8132/', icon: 'linkedin' },
  ],
};

export const PROJECTS = [
  {
    id: 'resume',
    label: 'Resume',
    title: "Hi, I'm Thomas",
    subtitle: ['A fullstack developer with interests in web development and signal processing'],
    html: `
<h2>Frontend developer at BeTomorrow <span>Since 2022</span></h2>
<p>I joined BeTomorrow as a frontend developer in 2022. I worked on the BeTomorrow website as well as on a range of internal and client projects, from classic web apps to AI-powered products built on RAG pipelines and agentic workflows.</p>
<div class="tech">React, Next.js, Contentful, Python, LangGraph, Langfuse, RAG, AI agents, Supabase</div>
<h2>Web developer at ACH International <span>2019 - 2022</span></h2>
<p>I worked part-time at ACH International as a web developer from 2019 to 2022. I did a full rework of their main online store Idealtek around winter 2019, and built most of the back-end of their two websites Sunraev and Idealrent. I also developed a fully customized WordPress theme compatible with WooCommerce for their online stores.</p>
<div class="tech">Php, Javascript, MySQL, Wordpress, Woocommerce, Odoo</div>
<h2>Computer science master at Université de Bordeaux <span>2018 - 2021</span></h2>
<p>I completed in summer 2021 my computer science master degree with a specialization in image and sound processing. We learned there a lot of cool concepts such as code complexity, convolutional neural network, 3D Fourier transform or convolution matrix.</p>
<div class="tech">C++, C, OpenCV, Tensorflow, Python, OpenGL, FFTW</div>
<h2>Internship at Ochanomizu University in Tokyo, Japan <span>Spring 2018</span></h2>
<p>This was a shared internship with Nathan Joubert and Gaëtan Basile, in which we developed a visualization software for CCG2Lambda. CCG2Lambda is a software converting natural language (english or japanese) to semantic representation developed by the Bekki lab at Ochanomizu University. This allowed us to discover language theory and graph theory. We also did a website to show their results.</p>
<div class="tech">Java, JavaFX, NodeJS, AWS</div>
<h2>DUT : french two-year university degree in technology at Université de Bordeaux <span>2016 - 2018</span></h2>
<p>My two first years in computer science, we learned algorithms, database management, system development, network, accounting, communication, and so much more...</p>
<div class="tech">Java, C, C++, C#, JS, NET, HTML, CSS, Matlab, MySQL</div>`,
  },
  {
    id: 'twitchparty',
    label: 'TwitchParty',
    title: 'TwitchParty',
    subtitle: ['NodeJS, Angular, Firebase, Tmi.JS, Nginx'],
    html: `
<h2>What is TwitchParty ?</h2>
<p>This project allows twitch streamers to take part in various games with their viewers, without any software installation on viewer AND streamer side. To achieve this, I used an Angular front served with Nginx, which communicates with a Node backend running a twitch bot using Tmi.JS. The twitch bot reads the streamer irc channel and communicates any viewer interaction to the Angular application, which then compares the answer to the database, hosted on Firebase.</p>
<p>There are currently 6 games available on TwitchParty (as of April 2022). "Premium" accounts are available for 4$, they provide almost no advantages but help me pay the server bill.</p>
${img('twitch-quizz/home.PNG', 'Home screen')}
<h2>Available games</h2>
<h3>Quizz</h3>
<p>This is a general knowledge quizz in which viewers earn points when they get the right answer. Everyone can propose questions on a form accessible on the website. There are 1600+ questions available right now (in french), divided in categories such as mathematics, history, music etc... Some voluntary people have a "contributor" role, which gives them a screen where they can see their proposed questions and already existing questions.</p>
${img('twitch-quizz/quizz.PNG', 'Quizz screen')}
<h3>Fairprice</h3>
<p>As in the TV show, in this game the viewers have to guess the price of an object displayed on screen. The different objects are stored in a database that I built using a python script which parses Amazon products.</p>
${img('twitch-quizz/fairprice.PNG', 'Fairprice screen')}
<h3>Pictionary</h3>
<p>In this game, the streamer draws a randomly picked word, the viewers have to guess the word. In order to have a fun game, we used <a href="http://www.lexique.org/shiny/openlexicon/" target="_blank" rel="noopener">Open Lexicon</a>, on which a list of words with an imageability score is available. After some data filtering (verb, plural, offense, etc...) we got a list of words well suited for pictionary.</p>
<p>In order to do the drawing board I used the <a href="https://www.npmjs.com/package/simple-drawing-board" target="_blank" rel="noopener">simple-drawing-board</a> library on npm, that I modded to add a fill feature. My version is available on <a href="https://www.npmjs.com/package/@tguesdon/simple-drawing-board" target="_blank" rel="noopener">npm</a>.</p>
${img('twitch-quizz/pictionary.PNG', 'Pictionary screen')}
<h3>Trader</h3>
<p>Trader is a game mocking the trading system, the streamer has to get a certain amount of money, and the viewers can either be with or against him. But most of the time it doesn't matter because some random incongruous events occur and reverse the course of the game.</p>
${img('twitch-quizz/trader.PNG', 'Trader screen')}
<h3>Connect4</h3>
<p>This is pretty much self explanatory, connect4, streamer against viewers.</p>
${img('twitch-quizz/connect4.PNG', 'Connect4 screen')}
<h3>Twitch Inspector</h3>
<p>In this game, the streamer has a list of words that the twitch chat must guess. In order to do this the streamer tells a word which has a close meaning to those that the chat has to guess. This is inspired by the game "Codenames".</p>
${img('twitch-quizz/codenames.PNG', 'Twitch inspector screen')}
<h2>How was it made ?</h2>
<p>The website works thanks to 3 parts :</p>
<ul>
<li>The database : A firebase project which contains all the data.</li>
<li>The server : A NodeJS server which is the link between the twitch chat and the client.</li>
<li>The client : An Angular client, served with nginx.</li>
</ul>
<h3>Firebase Database</h3>
<p>This is a classic firebase project, with realtime database used to store data in JSON format and authentication to allow account management on the client. The security of a realtime database is different than a classic SQL Database, as the access is available to everyone using the client. I use realtime database access rules which allow me to specify rights on read or write.</p>
<h3>NodeJS Server</h3>
<p>The NodeJS server uses Tmi.JS to communicate with the twitch channel, and then uses Socket.io to communicate with the client. It also contains authentication functions.</p>
<h3>Angular Client</h3>
<p>The Angular client is the biggest part of this application. It can be divided into two parts : the back-office and the games. The games are described up ahead.</p>
<p>I used angular material to create a clean and ergonomic way to manage our content. It includes quizz questions, fairprice products, users and statistics.</p>
${img('twitch-quizz/statistics.PNG', 'Statistics view')}
${img('twitch-quizz/questions.PNG', 'Questions view')}
${img('twitch-quizz/contributor.PNG', 'Contributor view')}`,
  },
  {
    id: 'idealtek',
    label: 'Idealtek',
    title: 'Idealtek',
    subtitle: ['Wordpress, MySQL, PhP, Js'],
    html: `
<h2>A Wordpress theme from scratch</h2>
<p>Idealtek is an e-commerce website selling electric vehicles. Until recently, the website used the Wordpress framework along with a lot of plugins to work as wanted. The high number of plugins and customizations made maintenance difficult. Plus, this also led to a slow and heavy website with lots of useless code loaded. I worked with Julien Piault (seo expert) and Jean-Marc Gagnebien (front web developer) in order to build a theme from scratch that aims to be fast and ergonomic.</p>
<p>Some features I find interesting are described below. There is a lot more that can be seen on the website if you want.</p>
<h2>Functionalities</h2>
<p>The Idealtek website got all shipped functionalities of Woocommerce, meaning a product page, a category page and a cart and checkout page. We added various functionalities described below.</p>
<h3>Ajax product search</h3>
<p>I replaced Wordpress native searchbar, which searches among all posts, with an ajax searchbar which only searches among products. Creating this searchbar allowed me to discover Ajax and its integration in a Wordpress environment.</p>
${img('idealtek/search_bar.PNG', 'AJAX search bar')}
<h3>Ajax products filters</h3>
<p>After discovering Ajax, I used it again to create products filters on category pages. This also allowed me to manipulate Wordpress WP_Query class in depth along with the pagination system. I used Wordpress meta values in the query to fetch the products given the user's input.</p>
${img('idealtek/product_filter.PNG', 'Product filtered by autonomy')}
<h3>Preorder with deposits</h3>
<p>The preorder feature is one of the most advanced features implemented in this theme, mainly due to the fact that it is allowed to pay a deposit with payment completion later. In order to do that I used products meta values, cart item custom data, cronjob and the wp_mail function.</p>
${img('idealtek/preorder_form.PNG', 'Preorder form on product page')}
<p>The meta values are used to store if a product can be preordered, and the date of availability. I had to go deeper into woocommerce documentation in order to modify the price of the item in the cart. Then, I used a cronjob to check everyday if any order contained a preordered product that is available this day, if so, an email is sent with a payment link.</p>
<h3>MyPangee long-term rental integration</h3>
<p>MyPangee is a long-term rental provider, but they don't provide a wordpress plugin for integration. I developed our own plugin to interact with their API. The plugin displays the minimal price per month on product pages and product thumbnails, and, more essentially, it adds a link on the cart page to the application for long term rental if the cart is compatible.</p>
${img('idealtek/lld_product_thumbnail.PNG', 'Price per month displayed on product thumbnail')}
<h2>Optimization</h2>
<p>Optimization was one of our main concerns while building this website. I used PageSpeed to measure the performance of the website throughout the development process. On the old Idealtek website, we used various optimization plugins but never got a satisfying result, so this time I tried to integrate various optimizations directly in the theme, with some ideas coming from the web and some found by myself.</p>
<p>The theme is fully compliant with google web vitals as you can see with those all green images or directly at PageSpeed.</p>
${gallery(['idealtek/mobile_score.PNG', 'idealtek/desktop_score.PNG'], 'Mobile and desktop score on pagespeed')}
<h3>CSS and JS filtering</h3>
<p>One major issue with most Wordpress themes is that they load one big CSS file which contains the style for every page, this is obviously not optimized. I used comparisons on the url to load only the needed css. This easy trick greatly improved the performance.</p>
<h3>Minification</h3>
<p>Before enqueueing any css or js file, I apply a minification algorithm. This can usually be done with plugins such as WP_Rocket or WP Autoptimize, but I found it way lighter to use only two functions instead of a complete plugin.</p>
<h3>Use of WebP</h3>
<p>WebP is an image format which is lighter than the traditional png and jpg images. It is compatible with almost all used web browsers, so it was necessary that we use WebP for our images. Writing an algorithm to convert png and jpg to webP seemed out of the scope of the project, so we used Imagify to optimize our images.</p>`,
  },
  {
    id: 'photocleaner',
    label: 'Photocleaner',
    title: 'Photocleaner',
    subtitle: ['C++, Qt, OpenCV'],
    html: `
<h2>A tool which removes visual defaults from photos</h2>
<p>TG's E-commerce photo cleaner is an experimental project on which I tested if I could clean ecommerce product photos. In order to do that I used my knowledge from computer vision studies and the openCV library.</p>
<p>This project offers the following functionalities :</p>
<ul>
<li>Background uniformization</li>
<li>Illumination correction</li>
<li>Object centering</li>
<li>Image compression (W.I.P.)</li>
<li>Watermark (W.I.P.)</li>
</ul>
<p>I used various methods coming from computer vision such as global thresholding, adaptive thresholding and CLAHE algorithm. The results shown on this page use adaptive thresholding. I still have to test canny edge detection, this page will be updated when I do so.</p>
<h2>Contouring</h2>
<p>Contouring is the most important functionality of this project, mainly because it is used for both object centering and background uniformization. An approximate contouring can be used for object centering but a very precise one is needed for background uniformization in order to avoid leftovers, often due to the object's shadow.</p>
<p>I tested global thresholding with Otsu's binarization and adaptive gaussian thresholding to get the contours of the object. Right now the best fit seems to be the adaptive gaussian thresholding, but it still isn't perfect and canny edge detection is left to be tested.</p>
${gallery(['ecommerce-photo-cleaner/contour_1.JPG', 'ecommerce-photo-cleaner/contour_2.JPG'], 'Contours detection with adaptive gaussian thresholding')}
<h2>Object centering</h2>
<p>Object centering after contour detection is relatively easy, the pixels inside the contour are moved with the difference between the image's center and the contour's center.</p>
${gallery(['ecommerce-photo-cleaner/before_centering_1.JPG', 'ecommerce-photo-cleaner/after_centering.JPG'], 'Before and after centering')}
<h2>Background uniformization</h2>
<p>As for object centering, the main difficulty of background uniformization is the contour detection. Once this is done, I replace every pixel outside of the contour with white pixels.</p>
${gallery(['ecommerce-photo-cleaner/origin_2.JPG', 'ecommerce-photo-cleaner/background_2.JPG'], 'Before and after background uniformization')}
<h2>Illumination correction</h2>
<p>The illumination correction fix is in fact an improvement of the image's contrast. I used CLAHE algorithm in order to do this.</p>
${gallery(['ecommerce-photo-cleaner/illumination_2.JPG', 'ecommerce-photo-cleaner/illumination_1.JPG'], 'Before and after illumination correction')}`,
  },
  {
    id: 'spaceconquest',
    label: 'Space Conquest',
    title: 'Space Conquest',
    subtitle: ['Java, JavaFX', 'With Louis Jolliet'],
    html: `
<h2>The game</h2>
<p>Space Conquest is a Java project created during our final year of an IT bachelor's degree in University of Bordeaux (FR). It's a strategy game where you are the Ambassador of the red planet and will have to conquer all planets around. It contains an implementation of the A* algorithm.</p>
${img('space-conquest/home.PNG', 'Home screen')}
${img('space-conquest/battle.PNG', 'One game')}
${img('space-conquest/battle-2.PNG', 'Another more advanced game')}
<h2>Rules</h2>
<p>To conquer another planet you'll have to send spaceships on it. You also can choose the amount of spaceships sent (in %). To win a game you need to take every planet belonging to users, it is not necessary to take all neutral planets. You cannot send too many spaceships at a time, so when you try to send a lot of spaceships they will be withdrawn from your spaceships and sent periodically in waves if there is no allied spaceship in orbit.</p>
<h2>Controls</h2>
<ul>
<li>Use the option tab in the main menu to configure the game as you like.</li>
<li>Use drag and drop from one of your planets to an enemy planet to attack this planet with your spaceships.</li>
<li>Use drag and drop from one of your planets to another one to send spaceships on this planet.</li>
<li>Use the slider below your planets to choose which percentage of spaceships will go when sending spaceships.</li>
<li>Click on a ship to select its squadron.</li>
<li>Click and create a rectangle to select multiple squadrons.</li>
<li>If a squadron is selected (highlighted in white), you can click on a planet to change its destination.</li>
<li>During a game, use the menu at the left top of the screen to save, restore or exit the game.</li>
<li>You can select spaceships with a drag and drop movement, it will display a selection area.</li>
</ul>
<h2>Functionalities</h2>
<h3>Planets</h3>
<ul>
<li>Planets are generated with random size, speed production and position.</li>
<li>A planet produces spaceships. The number of available spaceships is displayed on the planet.</li>
<li>When a planet is attacked, if its available spaceships fall below 0, the attacker becomes the new owner.</li>
<li>A planet can receive allied spaceships, which will be added to its available spaceships.</li>
<li>There is a minimal distance between each player's starting planet to balance the game.</li>
<li>There is also a minimal distance, smaller, between any planet and a neutral planet.</li>
</ul>
<h3>Spaceships</h3>
<ul>
<li>There are two different types of spaceship, with different speed, damage and length.</li>
<li>Spaceships must be launched from a planet.</li>
<li>A spaceship hitting an enemy planet will withdraw one spaceship from the planet's available spaceships.</li>
<li>A spaceship arriving on an allied planet will add one spaceship to the planet's available spaceships.</li>
<li>A spaceship being part of a selected squadron will be highlighted in white.</li>
<li>Selected spaceships can have their target changed.</li>
<li>Spaceships automatically follow a path without obstacle when getting from a planet A to a planet B.</li>
<li>If a spaceship crashes on an enemy planet, an explosion appears.</li>
</ul>
<h3>AI</h3>
<ul>
<li>It is possible to play against 1 to 4 AI.</li>
<li>AI have a simple behaviour, they attack the nearest planet.</li>
<li>There are three different types of AI : Classic, Safe and Aggressive AI. They will send more or less ships depending on their type.</li>
</ul>
<h3>Pirates</h3>
<ul><li>During the game, neutral spaceships will spawn on the border of the screen and attack randomly players and neutral planets.</li></ul>
<h3>Save system</h3>
<ul>
<li>It is possible to save/restore your game using the menu at the top left of the screen during a game.</li>
<li>The save is stored in "res/save.ser".</li>
<li>It takes some time to save/restore, if your screen freezes just wait a bit.</li>
<li>An alert warns you when the program finished saving/restoring your game. You can close it with the "ok" button, it will close itself automatically 2 seconds later.</li>
</ul>
<h3>Options</h3>
<ul>
<li>There is an option tab available in the main menu. Clicking on "Apply" is necessary to save changes.</li>
<li>Possibility to choose between 2 to 5 players (one human and only AI).</li>
<li>Possibility to choose between 5 to 20 neutral planets.</li>
<li>Possibility to choose the screen size.</li>
<li>Possibility to optimize the game.</li>
</ul>
<h3>Optimization</h3>
<ul>
<li>This mode can be activated if your computer is too slow to run this game.</li>
<li>There are no images in this mode.</li>
<li>Pathfinder is less precise.</li>
<li>There is no collision drawing.</li>
</ul>`,
  },
  {
    id: 'menulib',
    label: 'Menulib',
    title: 'Menulib',
    subtitle: ['Angular, Firebase', 'With Louis Jolliet, Paul Vigneau, Thomas Barre-Pitous'],
    html: `
<p>MenuLib is a web application which allows customers to order at the restaurant with a Qr Code. Its main difference with similar applications is that the Qr Code is displayed on a screen and changed after each use. This protects against any malicious possibility.</p>
<h2>Project Manager</h2>
<p>My first role on this project was a supervisor role, I helped Idealtek Concept to write their specifications and made contact with Paul, Louis and Thomas. I had to verify that they met our expectations during the project, and was their main contact at Idealtek Concept.</p>
<p>They delivered the application in time with all the asked functionalities.</p>
<h3>Functionalities V1</h3>
<h4>Restaurant admin panel</h4>
<p>A dashboard only accessible by the restaurant administrator</p>
<ul>
<li>Add / Edit / Delete articles</li>
<li>Add / Edit / Delete categories</li>
<li>Add "meal of the day" articles</li>
<li>Theme choice</li>
<li>Restaurant settings</li>
<li>Add / Edit / Delete security code</li>
</ul>
${gallery(['menulib/admin-view.PNG', 'menulib/admin-settings.PNG'], 'Some admin views')}
<h4>Preparer panel</h4>
<p>A view of all orders being prepared, with the possibility to validate and clear them. Used in the restaurant kitchen.</p>
<h4>Customer panel</h4>
<p>A view used to browse all articles and categories, with a cart that can be validated so the order goes to the kitchen.</p>
<h2>Developer</h2>
<p>After getting the V1 from Louis, Paul and Thomas, I switched back to a developer role. We showed our application to some potential clients to get some insights on what to improve next.</p>
<p>I did a full visual rework to get a more "sellable" visual, with the addition of new themes for café and pizzeria. This is also when we decided to use a Qr Code displayed on screen that changes after each use. I added this functionality along with a number id for the orders.</p>
<h2>Gallery</h2>
${img('menulib/home.jpg', 'Home view')}
${img('menulib/article-page.jpg', 'Article view')}
${img('menulib/cart.jpg', 'Cart view')}`,
  },
  {
    id: 'mashuphelper',
    label: 'Mashup Helper',
    title: 'Mashup Helper',
    subtitle: ['Angular, Firebase'],
    html: `
<p>This web app uses angular, angular material and firebase to propose an easy way to visualize songs that are candidates for mashups (a mix of both songs). There are 3 views, one listing the artists, one listing the songs and one displaying a table of the songs with their bpm and tonality. The table allows to quickly find if two artists have compatible songs, by highlighting their songs when the artists are selected. This is way easier to read than an excel file, and is easier to fill and organize.</p>
<p>Sadly this web app was conceived to be used only by PNL World, so you won't be able to see the views by yourself. That is why I put a little gallery just below, however if someone is interested in getting an access, don't hesitate to contact me.</p>
${img('mashup-helper/grid.PNG', 'Mashup Table')}
${img('mashup-helper/artists.PNG', 'Artists view')}
${img('mashup-helper/songs.PNG', 'Songs view')}`,
  },
  {
    id: 'blindtestrap',
    label: 'Blindtestrap',
    title: 'Blindtestrap',
    subtitle: ['Pure JS'],
    html: `
<p>Blindtestrap is a website allowing you to play blindtest with french rap songs. It is special in a way that the songs are chosen by a human (me), and not a database. Moreover, you can also guess with the video clip, as they are visible but blurred. That was intended in order to reward rap geeks like me.</p>
<p>There is not a lot more to say about this, it was done when I wasn't really good at web development, so I'll probably do a rework soon.</p>
${img('blindtestrap/view.PNG', 'Home view')}`,
  },
  {
    id: 'buildideas',
    label: 'BuildIdeas',
    title: 'BuildIdeas',
    subtitle: ['Java, Spigot'],
    html: `
<p>BuildIdeas is a Spigot Minecraft plugin, it was developed with Java and the Spigot library. All explanations along with download link are available on the <a href="https://www.spigotmc.org/resources/buildideas.61128/" target="_blank" rel="noopener">spigot page</a>.</p>`,
  },
  {
    id: 'planetgenerator',
    label: 'Planet Generator',
    title: 'Procedural Planet Generator',
    subtitle: ['C++, OpenGL, GLFW, Eigen3, SOIL, Surface_Mesh', 'With William Daigremont, Robin Montfermé, Léo Souvay, Théo Videau'],
    html: `
<h2>Report (french)</h2>
<p><a class="dl" download href="${ASSETS}downloads/procedural_planet_generator_report.pdf">Download the PDF report</a></p>
<h2>What is it ?</h2>
<p>Procedural planet generator is a university project in which we generate a low poly planet with procedural algorithms. This includes biomes, oceans and mountains and uses various concepts such as Perlin Noises, uniform repartition of points on a sphere, texturing or seeding.</p>
<p>I mainly worked on the tectonic plates and mountains.</p>
<h3>Final result</h3>
${img('procedural-planet/terrestre.png', 'A planet generated with our tool')}
<h3>Different icosahedron subdivision</h3>
${gallery(['procedural-planet/subdivision_3.png', 'procedural-planet/subdivision_6.png'], 'Spheres generated with an icosahedron divided 3 times or 6 times')}
<h3>Tectonic plates, mountains and temperature</h3>
${gallery(['procedural-planet/plaques.png', 'procedural-planet/temperature.png'], 'Tectonic plates and temperature')}`,
  },
  {
    id: 'finalschoolproject',
    label: 'Final school project',
    title: "Tool to do 3D analysis on plant's vascular system",
    subtitle: ['C++, Inviwo', 'With Robin Montfermé, Delphine Martin-Delozanne, Amandine Chauveau'],
    html: `
<h2>Report (french)</h2>
<p><a class="dl" download href="${ASSETS}downloads/pfe.pdf">Download the PDF report</a></p>`,
  },
];
