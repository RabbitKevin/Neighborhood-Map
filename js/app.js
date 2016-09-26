/**
    Model created for venue listed in map
*/
var Venue = function(list, foursquareID) {
    //Location information
    this.lat = list.venue.location.lat;
    this.lng = list.venue.location.lng;
    this.formattedAddress = list.venue.location.formattedAddress;//Array contains address information
    this.formattedPhone = list.venue.contact.formattedPhone;
    this.marker = {};
    //Venue brand information
    this.name = list.venue.name;
    this.id = list.venue.id;
    this.category = this.getCategory(list);
    //------Useful links--------------//
    this.photoPrefix = "https://irs2.4sqi.net/img/general/";
    //this.photoSize = "100x100";
    //-----Possible info offered------//
    this.formattedContact = this.getFormattedContact(list);
    this.tips = this.getTipsInfo(list);
    this.url = this.getUrl(list);
    this.rating = this.getRating(list);
    this.photoUrl = this.getPhotoUrl(list);
}
Venue.prototype = {
    getFormattedContact: function(data) {
        if(!data.venue.contact.formattedPhone) {
            return "Contact not available";
        }
        return data.venue.contact.formattedPhone;
    },
    getTipsInfo: function(data) {
        if(!data.tips) {
            return "Tips not available";
        }
        return data.tips[0].text;
    },
    getUrl: function(data) {
        if(!data.venue.url) {
            return "Website not available";
        }
        return data.venue.url;
    },
    getRating: function(data) {
        if(!data.venue.rating) {
            return "Rating not available";
        }
        return data.venue.rating;
    },
    getPhotoUrl: function(data) {
        if(!data.venue.featuredPhotos) {
            return "http://placehold.it/100x100";
        }
        return this.photoPrefix+'100x100'+data.venue.featuredPhotos.items[0].suffix;
    },
    getCategory: function(data) {
        if(!data.venue.categories[0]) {
            return "Category not available";
        }
        return data.venue.categories[0].name;
    }
}
function AppViewModel() {
    //-----Delivering object handler----//
    var self = this;
    var searchPos,
        infowindow,
        latInfo,
        lngInfo,
        bounds,
        centerMarker,
        map;
    var default_ExploreKeyWord = 'restaurant';
    var default_SearchPlace = 'Milpitas'
    var defaultShowList = true;
    //------Observable data--------------//
    self.search_location = ko.observable(default_SearchPlace);
    self.exploreKeyword = ko.observable(default_ExploreKeyWord);
    self.popularLocation = ko.observableArray();//list for venue
    self.filteredLocation = ko.observableArray();
    self.selectedMarker = ko.observable();
    self.isListVisible = ko.observable(defaultShowList);//value for list control icon
    self.filterKeyword = ko.observable();//keyword for filter
    //function getNearby
    //---------Inner function-------//

    function setMarkerBounce(marker) {
        if(!marker.getAnimation()) {
            self.popularLocation().forEach(function(venue) {
                venue.marker.setAnimation(null);
            });
            marker.setAnimation(google.maps.Animation.BOUNCE);
        }
    }

    function createMarkerWindowInfo(venue) {
        var content = '<div class="venue-infowindow">'
                            + '<div class="venue-category"><span class="glyphicon glyphicon-user"></span>'
                            + venue.tips
                            + '</div>'
                            + '</div>';
        return  content;
    }

    //Create single marker for given venue object//
    function createVenueMarkers(venue) {
        var venuePosition = new google.maps.LatLng(venue.lat, venue.lng);
        var venueMarker = new google.maps.Marker({
            map: map,
            position: venuePosition,
            title: venue.name
        });
        //------Add clicker info-----//
        venueMarker.addListener('click', function() {
            document.getElementById(venue.id).scrollIntoView();
            map.setCenter(venuePosition);//move the center to the position marker if not in there
            setMarkerBounce(venue.marker);
            var markerWindowInfo = createMarkerWindowInfo(venue);
            infowindow.setContent(markerWindowInfo);
            infowindow.open(map, venueMarker);
        });
        venue.marker = venueMarker;
    }

    /*
        @para position, geography info object for required position
        @p
    */
    function setMapCenterMarker(position) {
        if(centerMarker) centerMarker.setMap(null);//remove center Marker from the Map
        map.panTo(position.geometry.location);//move the map to searched result place
        //Create single market for the searched location point
        var positionIcon = {
            path: 'M0-48c-9.8 0-17.7 7.8-17.7 17.4 0 15.5 17.7 30.6 17.7 30.6s17.7-15.4 17.7-30.6c0-9.6-7.9-17.4-17.7-17.4z',
            fillColor: 'black',
            fillOpacity: 1,
            scale: 0.5
        };
        var positionMarker = new google.maps.Marker({
            map: map,
            position: position.geometry.location,
            title: position.name,
            icon: positionIcon
        });
        centerMarker = positionMarker;
        //Add event listener to the position Marker
        positionContent = "<h2>"+positionMarker.getTitle()+"<h2>";
            //Create inforwindow that contains position info
        infowindow = new google.maps.InfoWindow({
            content: positionContent
        });
        positionMarker.addListener('click', function() {
            //map.setZoom(8);
            map.setCenter(positionMarker.getPosition());//move the center to the position marker if not in there
            infowindow.open(map, positionMarker);
        });
    }
    //------------Request foursquare info---------------//
    function getFourSquareInfo() {
        var exploreURL = 'https://api.foursquare.com/v2/venues/explore?';
        var date_info = '&v='+getCurrentDate();
        var client_info = 'client_id=S1RJQM0E1RW01XHHNRHUD4ZCVO0JX2ELJHIJAPYNVGDU0TCO&client_secret=RS3IT5QWQJ34P20FSPDMMSFJ1NLUCY14LRZB31WAS2AKAUJZ';
        var query = '&query=' + self.exploreKeyword();
        var positionInfo = '&ll='+latInfo+','+lngInfo;
        var photoParameter = '&venuePhotos=1';
        var ajaxURL = exploreURL + client_info +date_info + photoParameter + positionInfo + query;
        //------Ajax request------//
        $.ajax({
            url : ajaxURL,
            success : function(data){
                console.log('request successful');
                console.log(data);
                var responseData = data.response.groups[0].items;//Array contain all venue information
                self.popularLocation([]);
                self.filteredLocation([]);
                responseData.forEach(function(item){
                    //console.log(item.venue.name);
                    var tmp = new Venue(item, client_info);
                    self.popularLocation.push(tmp);//location info for all venue(not filtered)
                    self.filteredLocation.push(tmp);//array for those filtered venue
                });
                self.popularLocation().forEach(function(venue){
                    createVenueMarkers(venue);//create venue Markers for each venue
                });
                var mapBounds = data.response.suggestedBounds;
                if (mapBounds != undefined) {
                    console.log('Bounds change');
                    bounds = new google.maps.LatLngBounds(
                        new google.maps.LatLng(mapBounds.sw.lat, mapBounds.sw.lng),
                        new google.maps.LatLng(mapBounds.ne.lat, mapBounds.ne.lng));
                    map.fitBounds(bounds);
                }
            },
            complete: function() {
                if(self.search_location().length === 0)
                    $('#filter-error').html('<h2>No matched result available.</h2>');
            },
            error: function( data ) {
                $('#filter-error').html('<h2>Request failed</h2>');
            }
        });
    }

    function getGeographyInfoCallBack(placeList, status) {
        //The response do not contain a valid result
        if(status != google.maps.places.PlacesServiceStatus.OK) {
            $('#Map_Loading_Error').html('<h2>Errors in searching</h2><h2>Try other position name</h2>');
            return;
        }
        var searchPlace = placeList[0];//get the first return pos
        //set center Marker
        setMapCenterMarker(searchPlace);
        latInfo = searchPlace.geometry.location.lat();
        lngInfo = searchPlace.geometry.location.lng();
        //Request map info and draw marker
        getFourSquareInfo();
    }
    /*
        Get location info and use return info for Venue info
    */
    function getGeographyInfo(locationName) {
        var request = {
            query: locationName
        };
        searchService = new google.maps.places.PlacesService(map);
        searchService.textSearch(request, getGeographyInfoCallBack);//get geometry information about input pos
    }
    function getCurrentDate() {
        var date = new Date();
        var year = date.getFullYear()+'';
        var month = date.getMonth()+1;
        month = month > 9?month+'':'0'+month;
        var day = date.getDate();
        day = day > 9?day+'':'0'+day;
        return year+month+day;
    }
    /*
        Initialize map config
    */
    function initializeMap() {
        mapOptions = {
            center: {lat: 37.777158, lng: -122.4185117},//just for test, initial position
            zoom: 12,
            diableDefaultUI: true
        };
        if(typeof google == 'undefined') {
            $('#Map_Loading_Error').html('<h2>Errors in retriving map</h2><h2>Check network and try refresh page later.</h2>');
            return;
        }
        map = new google.maps.Map(document.getElementById('Map_Canvas'), mapOptions);//create map obj
        $('#Map_Canvas').height($(window).height());//Set the height of map to the height of whole window
        getGeographyInfo(default_SearchPlace);
    };
    //Initialize map and set event listener to it so that the map is responsive
    google.maps.event.addDomListener(window, 'load', initializeMap);
    google.maps.event.addDomListener(window, "resize", function() {
        var center = map.getCenter();
        google.maps.event.trigger(map, "resize");
        map.setCenter(center);
    });


    /*
        Method triggered by search button in page
    */
    self.searchPos = function() {
        getGeographyInfo(self.search_location());
    }
    /*
        for selected list in the image list, move the map to corresponding marker
    */
    self.panToVenueMarker = function(venue) {
        var venueInfowindowStr = createMarkerWindowInfo(venue);
        var venuePosition = new google.maps.LatLng(venue.lat, venue.lng);

        self.selectedMarker(venue.marker);
        infowindow.setContent(venueInfowindowStr);
        infowindow.open(map, venue.marker);
        map.panTo(venuePosition);
        setMarkerBounce(venue.marker);//This is for marker animation
    }
    /*
        show result list icon button
    */
    self.showList = function() {
        if(self.isListVisible()) {//show-hide
            $('.menuIcon').removeClass('glyphicon-plus-sign').addClass('glyphicon-minus-sign').text('show');
        } else {
            $('.menuIcon').removeClass('glyphicon-minus-sign').addClass('glyphicon-plus-sign').text('hide');
        }
        self.isListVisible(!self.isListVisible());
    }
    /*
        Filter function
    */
    self.filterVenue = function() {
        var keyword = self.filterKeyword().trim();
        self.filteredLocation.removeAll();
        console.log('Clear venue list');
        console.log(self.filteredLocation());
        self.popularLocation().forEach(function(venue) {
            venue.marker.setMap(null);//clear marker in map
            if(!keyword || venue.name.indexOf(keyword) !== -1) {
                venue.marker.setMap(map);//add marker to the map
                self.filteredLocation.push(venue);
            }
        });
    }
    self.filterTest = function() {
        console.log('filter test method');
    }
}

//Initialize the AppViewModel
function initMap() {
    $(function() {
        var viewModel = new AppViewModel();
        viewModel.filterKeyword.subscribe(viewModel.filterVenue);
        ko.applyBindings(viewModel);
    });
}
