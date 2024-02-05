const axios = require('axios');
const {BookingRepository} = require('../repositories/index')
const{FLIGHT_SERVICE_PATH} = require('../config/serverConfig');
const { ServiceError } = require('../utils/errors');

class BookingService{
   constructor(){
    this.bookingRepository = new BookingRepository();
   }

   async createBooking(data){
     try {
        const flightId = data.flightId;
        const getFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${flightId}`;
        const response = await axios.get(getFlightRequestURL);
        // flight.data.data;  //Because one .data is for axois from axios we need to fetch the important data and .data is from the data to find the importand flight details. we can check by flight.data and flight.data.data
        const flightData = response.data.data;
        let priceOfTheFlight = flightData.price;
        
        if(data.noOfSeats > flightData.totalSeats){
            throw new ServiceError('something went wrong in the booking process' , 'Insufficient seats in the flight')
        }
        const totalCost = priceOfTheFlight * data.noOfSeats;
        const bookingPayload = {... data , totalCost};
        const booking = await this.bookingRepository.create(bookingPayload);
        const updateFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${booking.flightId}`;
        console.log(updateFlightRequestURL)
        await axios.patch(updateFlightRequestURL , {totalSeats: flightData.totalSeats - booking.noOfSeats});
        const finalBooking = await this.bookingRepository.update(booking.id , {status : "Booked"});
        return finalBooking;
    } catch (error) {
        if(error.name === 'RepositoryError' || error.name === 'ValidationError'){
            throw error;
        }
        throw new ServiceError();
     }
   }
}

module.exports = BookingService;