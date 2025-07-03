import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Calendar, User, Mail, Phone, MessageSquare, CheckCircle, X, Globe } from 'lucide-react';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BookingData {
  name: string;
  email: string;
  phone: string;
  message: string;
  date: string;
  time: string;
}

const BookingCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    name: '',
    email: '',
    phone: '',
    message: '',
    date: '',
    time: ''
  });
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({});

  // Get current date for accurate calendar display
  useEffect(() => {
    // Set to current date on component mount
    setCurrentDate(new Date());
    
    // Load existing bookings from localStorage
    const existingBookings = JSON.parse(localStorage.getItem('calendar_bookings') || '[]');
    
    // Create a map of booked dates and times
    const bookedSlotsMap: Record<string, string[]> = {};
    existingBookings.forEach((booking: any) => {
      const dateKey = new Date(booking.date).toDateString();
      if (!bookedSlotsMap[dateKey]) {
        bookedSlotsMap[dateKey] = [];
      }
      bookedSlotsMap[dateKey].push(booking.time);
    });
    
    setBookedSlots(bookedSlotsMap);
    
    // Check if July 4th 11:30am is booked
    const july4 = new Date(2025, 6, 4).toDateString();
    if (!bookedSlotsMap[july4] || !bookedSlotsMap[july4].includes('11:30am')) {
      // Add the booking for July 4th 11:30am
      const newBooking = {
        id: Date.now(),
        name: 'Ankit Kumar',
        email: 'ankitkr5858@gmail.com',
        phone: '',
        message: '',
        date: new Date(2025, 6, 4).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        time: '11:30am',
        timestamp: new Date().toISOString(),
        status: 'confirmed'
      };
      
      existingBookings.push(newBooking);
      localStorage.setItem('calendar_bookings', JSON.stringify(existingBookings));
      
      // Update booked slots
      if (!bookedSlotsMap[july4]) {
        bookedSlotsMap[july4] = [];
      }
      bookedSlotsMap[july4].push('11:30am');
      setBookedSlots(bookedSlotsMap);
    }
  }, []);

  // Generate available time slots based on the selected date
  const getTimeSlots = (date: Date | null): TimeSlot[] => {
    if (!date) return [];
    
    // Today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if selected date is today
    const isToday = date.toDateString() === today.toDateString();
    
    // Base time slots
    const baseSlots = [
      { time: '11:30am', available: true },
      { time: '12:15pm', available: true },
      { time: '1:00pm', available: true },
      { time: '1:45pm', available: true },
      { time: '2:30pm', available: true },
      { time: '3:15pm', available: true },
      { time: '4:00pm', available: true },
      { time: '4:45pm', available: true },
      { time: '7:00pm', available: true },
    ];
    
    // Check for booked slots
    const dateKey = date.toDateString();
    const bookedTimesForDate = bookedSlots[dateKey] || [];
    
    // If it's today, disable past time slots
    if (isToday) {
      const currentHour = new Date().getHours();
      const currentMinute = new Date().getMinutes();
      
      return baseSlots.map(slot => {
        const [hourStr, minuteStr] = slot.time.replace('am', '').replace('pm', '').split(':');
        let hour = parseInt(hourStr);
        const minute = parseInt(minuteStr);
        
        // Convert to 24-hour format
        if (slot.time.includes('pm') && hour !== 12) {
          hour += 12;
        } else if (slot.time.includes('am') && hour === 12) {
          hour = 0;
        }
        
        // Disable if the time has passed (with 30 min buffer) or is booked
        const isPast = (hour < currentHour) || (hour === currentHour && minute <= currentMinute + 30);
        const isBooked = bookedTimesForDate.includes(slot.time);
        
        return {
          ...slot,
          available: !isPast && !isBooked
        };
      });
    }
    
    // For future dates, check only booked slots
    return baseSlots.map(slot => ({
      ...slot,
      available: !bookedTimesForDate.includes(slot.time)
    }));
  };

  // Get calendar data
  const getCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    
    // Get last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    // Adjust for Monday as first day of week
    const firstDayIndex = (firstDay.getDay() + 6) % 7;
    
    // Create array for all days in the calendar view
    const days = [];
    
    // Add days from previous month to fill the first week
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }
    
    // Add all days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add days from next month to complete the last week
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return { days, month, year };
  };

  const { days, month, year } = getCalendarData();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month;
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const isBooked = (date: Date) => {
    const dateKey = date.toDateString();
    return bookedSlots[dateKey] && bookedSlots[dateKey].length === 9; // All slots booked
  };

  const handleDateSelect = (date: Date) => {
    if (isPastDate(date) || !isCurrentMonth(date) || isWeekend(date) || isBooked(date)) return;
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleBooking = () => {
    if (!selectedDate || !selectedTime) return;
    
    setBookingData({
      ...bookingData,
      date: selectedDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: selectedTime
    });
    setShowBookingForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate booking submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store booking in localStorage
    const bookings = JSON.parse(localStorage.getItem('calendar_bookings') || '[]');
    const newBooking = {
      ...bookingData,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      status: 'confirmed'
    };
    bookings.push(newBooking);
    localStorage.setItem('calendar_bookings', JSON.stringify(bookings));
    
    // Update booked slots
    if (selectedDate) {
      const dateKey = selectedDate.toDateString();
      const updatedBookedSlots = { ...bookedSlots };
      if (!updatedBookedSlots[dateKey]) {
        updatedBookedSlots[dateKey] = [];
      }
      updatedBookedSlots[dateKey].push(selectedTime!);
      setBookedSlots(updatedBookedSlots);
    }
    
    setShowBookingForm(false);
    setShowSuccess(true);
    
    // Reset after 5 seconds
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedDate(null);
      setSelectedTime(null);
      setBookingData({
        name: '',
        email: '',
        phone: '',
        message: '',
        date: '',
        time: ''
      });
    }, 5000);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const getSelectedDateString = () => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get current time in IST for display
  const getCurrentISTTime = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    };
    return new Intl.DateTimeFormat('en-US', options).format(now);
  };

  // Get available time slots for the selected date
  const availableTimeSlots = selectedDate ? getTimeSlots(selectedDate) : [];

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-6xl mx-auto border border-gray-200">
      {/* Header */}
      <div className="bg-white p-8 border-b border-gray-200">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <img
              src="/DSC_0222.jpg"
              alt="Ankit Kumar"
              className="w-16 h-16 rounded-full object-cover"
              onError={(e) => {
                // Fallback if image doesn't load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling!.style.display = 'flex';
              }}
            />
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full items-center justify-center text-white font-bold text-xl hidden">
              AK
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ankit Kumar</h2>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">ReviewAI Demo Call</h3>
          
          <div className="flex items-center justify-center gap-6 text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>30 min</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe size={16} />
              <span>Web conferencing details provided upon confirmation.</span>
            </div>
          </div>
          
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get a comprehensive strategy with over 30 custom optimizations for your development workflow; free of charge.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left Side - Calendar */}
        <div className="p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Select a Date & Time</h3>
          
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-6">
            <motion.button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft size={20} />
            </motion.button>
            
            <h3 className="text-xl font-semibold">
              {monthNames[month]} {year}
            </h3>
            
            <motion.button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight size={20} />
            </motion.button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-8">
            {days.map((date, index) => {
              const isCurrentMonthDate = isCurrentMonth(date);
              const isPast = isPastDate(date);
              const isWeekendDate = isWeekend(date);
              const isTodayDate = isToday(date);
              const isSelectedDate = isSelected(date);
              const isBookedDate = isBooked(date);
              const isClickable = isCurrentMonthDate && !isPast && !isWeekendDate && !isBookedDate;

              return (
                <motion.button
                  key={index}
                  onClick={() => handleDateSelect(date)}
                  disabled={!isClickable}
                  className={`
                    aspect-square flex items-center justify-center text-sm rounded-lg transition-all font-medium
                    ${!isCurrentMonthDate ? 'text-gray-300' : ''}
                    ${isPast || isWeekendDate || isBookedDate ? 'text-gray-300 cursor-not-allowed' : ''}
                    ${isClickable ? 'hover:bg-blue-50 hover:text-blue-600 cursor-pointer' : ''}
                    ${isTodayDate && !isSelectedDate ? 'bg-gray-100 text-gray-900' : ''}
                    ${isSelectedDate ? 'bg-blue-600 text-white font-bold' : ''}
                    ${isBookedDate && isCurrentMonthDate && !isPast ? 'bg-gray-200 text-gray-400' : ''}
                  `}
                  whileHover={isClickable ? { scale: 1.1 } : {}}
                  whileTap={isClickable ? { scale: 0.9 } : {}}
                >
                  {date.getDate()}
                </motion.button>
              );
            })}
          </div>

          {/* Timezone */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Globe size={16} />
              <span className="font-medium">India Standard Time ({getCurrentISTTime()})</span>
            </div>
          </div>
        </div>

        {/* Right Side - Time Slots */}
        <div className="bg-gray-50 p-8">
          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Calendar size={64} className="text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Date</h3>
              <p className="text-gray-600">Choose a date from the calendar to see available time slots</p>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {getSelectedDateString()}
              </h3>

              {/* Time Slots */}
              <div className="space-y-3 mb-8">
                {availableTimeSlots.map((slot, index) => (
                  <motion.button
                    key={index}
                    onClick={() => slot.available && handleTimeSelect(slot.time)}
                    disabled={!slot.available}
                    className={`
                      w-full p-4 rounded-lg border-2 text-center transition-all font-medium
                      ${!slot.available 
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-100' 
                        : selectedTime === slot.time
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                      }
                    `}
                    whileHover={slot.available ? { scale: 1.02 } : {}}
                    whileTap={slot.available ? { scale: 0.98 } : {}}
                  >
                    {slot.time}
                  </motion.button>
                ))}
              </div>

              {/* Book Button */}
              {selectedTime && (
                <motion.button
                  onClick={handleBooking}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Book Demo Call - {selectedTime}
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking Form Modal */}
      <AnimatePresence>
        {showBookingForm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-md w-full p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Book Your Demo Call</h3>
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Calendar size={16} />
                  <span className="font-medium">{bookingData.date}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-800">
                  <Clock size={16} />
                  <span className="font-medium">{bookingData.time} IST (30 minutes)</span>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={bookingData.name}
                      onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={bookingData.email}
                      onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={bookingData.phone}
                      onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <div className="relative">
                    <MessageSquare size={20} className="absolute left-3 top-3 text-gray-400" />
                    <textarea
                      value={bookingData.message}
                      onChange={(e) => setBookingData({...bookingData, message: e.target.value})}
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Tell us about your project or specific questions..."
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Confirm Booking
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-md w-full p-8 text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <motion.div
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <CheckCircle size={32} className="text-green-600" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
              <p className="text-gray-600 mb-4">
                Your demo call has been scheduled for {bookingData.date} at {bookingData.time} IST.
              </p>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-semibold text-blue-900 mb-2">What's Next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• You'll receive a confirmation email shortly</li>
                  <li>• Calendar invite will be sent to your email</li>
                  <li>• Meeting link will be provided 24 hours before</li>
                  <li>• Feel free to prepare any specific questions</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-500">
                Need to reschedule? Contact us at{' '}
                <a href="mailto:ankitkr5858@gmail.com" className="text-blue-600 hover:underline">
                  ankitkr5858@gmail.com
                </a>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingCalendar;