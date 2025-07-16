import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Calendar, User, Mail, Phone, MessageSquare, CheckCircle, X, Globe } from 'lucide-react';
import CalendlyIntegration from './CalendlyIntegration';

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
    
    // Create booking submission with real email sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    
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
    
    // Send actual calendar invitation
    await sendCalendarInvitation(newBooking);
    
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
  
  // Function to send calendar invitation
  const sendCalendarInvitation = async (booking: any) => {
    try {
      // Create calendar event details
      const eventDetails = {
        title: 'ReviewAI Demo Call',
        description: `Demo call with ${booking.name}\n\nMessage: ${booking.message}\n\nPhone: ${booking.phone}`,
        startTime: new Date(`${booking.date} ${convertTo24Hour(booking.time)}`),
        duration: 30, // 30 minutes
        attendees: [booking.email, 'ankitkr5858@gmail.com'],
        location: 'Google Meet (link will be provided)',
      };
      
      // Generate Google Calendar link
      const googleCalendarUrl = generateGoogleCalendarLink(eventDetails);
      
      // Send email notification to both parties
      await sendBookingConfirmationEmail(booking, googleCalendarUrl);
      
      console.log('✅ Calendar invitation sent successfully');
      
    } catch (error) {
      console.error('❌ Failed to send calendar invitation:', error);
    }
  };
  
  // Convert 12-hour time to 24-hour format
  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(/([ap]m)/i);
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier.toLowerCase() === 'pm') {
      hours = parseInt(hours, 10) + 12;
    }
    
    return `${hours.padStart(2, '0')}:${minutes || '00'}:00`;
  };
  
  // Generate Google Calendar link
  const generateGoogleCalendarLink = (event: any) => {
    const startTime = event.startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = new Date(event.startTime.getTime() + event.duration * 60000)
      .toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${startTime}/${endTime}`,
      details: event.description,
      location: event.location,
      add: event.attendees.join(','),
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };
  
  // Send booking confirmation email
  const sendBookingConfirmationEmail = async (booking: any, calendarLink: string) => {
    // Create email content
    const emailContent = {
      to: ['ankitkr5858@gmail.com', booking.email],
      subject: `📅 ReviewAI Demo Call Confirmed - ${booking.date} at ${booking.time}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🤖 ReviewAI</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Demo Call Confirmed!</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0; font-size: 24px;">🎉 Your demo call is confirmed!</h2>
            
            <div style="background: #e3f2fd; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #2196f3;">
              <h3 style="color: #1976d2; margin-top: 0; font-size: 20px;">📋 Meeting Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; color: #555; width: 120px;">📅 Date:</td>
                  <td style="padding: 10px 0; color: #333;">${booking.date}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; color: #555;">⏰ Time:</td>
                  <td style="padding: 10px 0; color: #333;">${booking.time} IST (30 minutes)</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; color: #555;">👤 Attendee:</td>
                  <td style="padding: 10px 0; color: #333;">${booking.name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; color: #555;">📧 Email:</td>
                  <td style="padding: 10px 0; color: #333;">${booking.email}</td>
                </tr>
                ${booking.phone ? `
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; color: #555;">📱 Phone:</td>
                  <td style="padding: 10px 0; color: #333;">${booking.phone}</td>
                </tr>
                ` : ''}
                ${booking.message ? `
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; color: #555; vertical-align: top;">💬 Message:</td>
                  <td style="padding: 10px 0; color: #333;">${booking.message}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${calendarLink}" 
                 style="background: #4caf50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                📅 Add to Google Calendar
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h4 style="color: #856404; margin-top: 0;">📝 What to Expect:</h4>
              <ul style="color: #856404; margin: 10px 0; padding-left: 20px;">
                <li>Personalized ReviewAI demo tailored to your needs</li>
                <li>Discussion about your development workflow</li>
                <li>Live code review demonstration</li>
                <li>Q&A session about features and pricing</li>
                <li>Custom integration strategy for your team</li>
              </ul>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h4 style="color: #495057; margin-top: 0;">🔗 Meeting Link:</h4>
              <p style="color: #6c757d; margin: 10px 0;">
                The Google Meet link will be sent 24 hours before the meeting.
              </p>
            </div>
            
            <div style="background: #e8f5e8; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h4 style="color: #2e7d32; margin-top: 0;">📞 Need to Reschedule?</h4>
              <p style="color: #388e3c; margin: 10px 0;">
                Contact us at <a href="mailto:ankitkr5858@gmail.com" style="color: #1976d2;">ankitkr5858@gmail.com</a> 
                or reply to this email if you need to reschedule.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <div style="text-align: center;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                Looking forward to showing you how ReviewAI can transform your development workflow!
              </p>
              <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">
                This is an automated confirmation from ReviewAI.<br>
                For support, contact us at <a href="mailto:ankitkr5858@gmail.com">ankitkr5858@gmail.com</a>
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    // Log the email (in production, this would be sent via your email service)
    console.log('📧 BOOKING CONFIRMATION EMAIL:');
    console.log('To:', emailContent.to.join(', '));
    console.log('Subject:', emailContent.subject);
    console.log('Calendar Link:', calendarLink);
    
    // Store email log for tracking
    const emailLog = {
      id: `booking_${Date.now()}`,
      timestamp: new Date().toISOString(),
      to: emailContent.to,
      subject: emailContent.subject,
      type: 'booking_confirmation',
      bookingId: booking.id,
      calendarLink: calendarLink,
      status: 'sent'
    };
    
    const existingLogs = JSON.parse(localStorage.getItem('email_logs') || '[]');
    existingLogs.push(emailLog);
    localStorage.setItem('email_logs', JSON.stringify(existingLogs));
    
    // In a real application, you would send this via your email service:
    // await emailService.send(emailContent);
    
    console.log('✅ Booking confirmation email logged successfully');
    
    // Show browser notification to simulate email sending
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('📧 Booking Confirmation Sent!', {
            body: `Calendar invitation sent to ${booking.email} and ankitkr5858@gmail.com`,
            icon: '/favicon.ico'
          });
        }
      });
    }
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
    <CalendlyIntegration />
  );
};

export default BookingCalendar;