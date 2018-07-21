$(document).ready(function () {

    "use strict"; // Start of use strict

    /***************** Full Screen header ******************/

    var fullscreen = $(window).height();
    $('header').css('height', fullscreen);
    $(window).resize(function () {
        $('header').css('height', fullscreen);
    });

    /***************** Full Screen Slide ******************/

    var slideHeight = $(window).height();
    $('#home .item').css('height', slideHeight);
    $(window).resize(function () {
        $('#home .item').css('height', slideHeight);
    });

    /***************** Full Screen Banner ******************/

    var slideHeight = $(window).height();
    $('#text-rotator').css('height', slideHeight);
    $(window).resize(function () {
        $('#text-rotator').css('height', slideHeight);
    });

    /***************** Scroll Spy ******************/

    $('body').scrollspy({
        target: '.navbar-fixed-top',
        offset: 51
    });

    /***************** Page Scroll ******************/

    $(function () {
        $('a.page-scroll').bind('click', function (event) {
            var $anchor = $(this);
            $('html, body').stop().animate({
                scrollTop: $($anchor.attr('href')).offset().top
            }, 1500, 'easeInOutExpo');
            event.preventDefault();
        });
    });

    /***************** Text Rotate ******************/

    $(function () {
        $("#head-title").typed({
            strings: ["Strong", "Fearless", "Creative"],
            typeSpeed: 100,
            loop: true,
            startDelay: 100
        });
    });
    
    /***************** Owl Carousel Banner ******************/

    $("#owl-home").owlCarousel({
        navigation: true, // Show next and prev buttons
        slideSpeed: 300,
        paginationSpeed: 400,
        singleItem: true,
        transitionStyle: "fadeUp",
        autoPlay: true,
        navigationText: ["<i class='fa fa-angle-left fa-2x'></i>", "<i class='fa fa-angle-right fa-2x'></i>"]
    });
    /***************** Counter ******************/

    $('#fun-facts').bind('inview', function (event, visible, visiblePartX, visiblePartY) {
        if (visible) {
            $(this).find('.timer').each(function () {
                var $this = $(this);
                $({
                    Counter: 0
                }).animate({
                    Counter: $this.text()
                }, {
                    duration: 2000,
                    easing: 'swing',
                    step: function () {
                        $this.text(Math.ceil(this.Counter));
                    }
                });
            });
            $(this).unbind('inview');
        }
    });

    /***************** Portfolio ******************/

    $('#Container').mixItUp({
            animation: {
                effects: 'fade rotateY(90deg)'
            }
        })
        // Active Stat
    var $portfolio_selectors = $('.portfolio-filters >li>a');
    $portfolio_selectors.on('click', function () {
        $portfolio_selectors.removeClass('active');
        $(this).addClass('active');
        var selector = $(this).attr('data-filter');
        return false;
    });

    /***************** Owl-Carousel (Testimonials) ******************/

    $("#owl-testimonials").owlCarousel({
        navigation: false, // Show next and prev buttons
        slideSpeed: 600,
        paginationSpeed: 400,
        singleItem: true,
        transitionStyle: "goDown",
        autoPlay: true
    });

    // Google Map

    google.maps.event.addDomListener(window, 'load', init);

    function init() {
        // Basic options for a simple Google Map
        // For more options see: https://developers.google.com/maps/documentation/javascript/reference#MapOptions
        var mapOptions = {
            // How zoomed in you want the map to start at (always required)
            zoom: 15,

            // The latitude and longitude to center the map (always required)
            center: new google.maps.LatLng(33.5912284, -7.5210958, 17.18), // Casablanca

            // Disables the default Google Maps UI components
            disableDefaultUI: true,
            scrollwheel: false,

            // How you would like to style the map. 
            // This is where you would paste any style found on Snazzy Maps.
            styles: [{
                "stylers": [{
                    "hue": "#4cd7ff"
                }, {
                    "saturation": 250
                }]
            }, {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{
                    "lightness": 50
                }, {
                    "visibility": "simplified"
                }]
            }, {
                "featureType": "road",
                "elementType": "labels",
                "stylers": [{
                    "visibility": "off"
                }]
            }]
        };

        // Get the HTML DOM element that will contain your map 
        // We are using a div with id="map" seen below in the <body>
        var mapElement = document.getElementById('map');

        // Create the Google Map using out element and options defined above
        var map = new google.maps.Map(mapElement, mapOptions);
        var myLatLng = new google.maps.LatLng(33.592501, -7.522318);
        // Custom Map Marker Icon - Customize the map-marker.png file to customize your icon
        var marker = new google.maps.Marker({
            position: myLatLng,
            map: map,
            title: 'Hello World!'
        });
    }

    /***************** WOW.JS ******************/

    new WOW().init();

    /***************** Preloader ******************/

    $(window).load(function () { // makes sure the whole site is loaded
        $('.page-loader loader').fadeOut(); // will first fade out the loading animation
        $('.page-loader').delay(350).fadeOut('slow');
        // will fade out the white DIV that covers the website.
        $('body').delay(350).css({
            'overflow': 'visible'
        });
    })

});