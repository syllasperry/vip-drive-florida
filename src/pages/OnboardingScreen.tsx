import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import businessmanImg from "@/assets/onboarding-businessman.jpg";
import womanBookingImg from "@/assets/onboarding-woman-booking.jpg";
import chauffeurWelcomeImg from "@/assets/onboarding-chauffeur-welcome.jpg";

const onboardingSlides = [
  {
    image: businessmanImg,
    title: "Airport Transfers",
    description: "Professional chauffeur service for all major South Florida airports. Arrive in style and comfort."
  },
  {
    image: womanBookingImg,
    title: "Easy Booking",
    description: "Book your premium ride in just a few taps. Simple, fast, and secure reservation system."
  },
  {
    image: chauffeurWelcomeImg,
    title: "Professional Service",
    description: "Experienced, courteous drivers providing luxury transportation with the highest standards."
  }
];

const testimonials = [
  {
    name: "Michael Rodriguez",
    rating: 5,
    text: "Exceptional service! Always on time and professional.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "Sarah Johnson",
    rating: 5,
    text: "The best chauffeur service in Miami. Highly recommended!",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b5c3?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "David Chen",
    rating: 5,
    text: "Luxury vehicles and outstanding customer service.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "Amanda Williams",
    rating: 5,
    text: "Perfect for business travel. Professional and reliable.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
  }
];

const airports = [
  { code: "MIA", name: "Miami International Airport" },
  { code: "FLL", name: "Fort Lauderdale-Hollywood International Airport" },
  { code: "PBI", name: "Palm Beach International Airport" },
  { code: "OPF", name: "Opa-locka Executive Airport" },
  { code: "FXE", name: "Fort Lauderdale Executive Airport" }
];

interface Airport {
  code: string;
  name: string;
}

const DeparturesBoard = ({ airports }: { airports: Airport[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % airports.length);
        setIsFlipping(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [airports.length]);

  const nextAirport = airports[(currentIndex + 1) % airports.length];

  return (
    <div className="bg-black rounded-lg border-4 border-slate-700 p-6 font-mono">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-amber-400/30">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-amber-400 rounded-sm flex items-center justify-center">
            <span className="text-black text-xs font-bold">✈</span>
          </div>
          <span className="text-amber-400 text-sm font-bold">DEPARTURES</span>
        </div>
        <div className="text-amber-400 text-sm font-bold">VIP CHAUFFEUR</div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-12 gap-2 mb-2 text-amber-400/70 text-xs font-bold uppercase">
        <div className="col-span-2">CODE</div>
        <div className="col-span-6">DESTINATION</div>
        <div className="col-span-2">STATUS</div>
        <div className="col-span-2">GATE</div>
      </div>

      {/* Departure Row */}
      <div className="grid grid-cols-12 gap-2 items-center py-3 border-t border-amber-400/20">
        {/* Airport Code */}
        <div className="col-span-2">
          <div className={`text-amber-400 text-lg font-bold transition-all duration-300 ${
            isFlipping ? 'animate-flip' : ''
          }`}>
            {airports[currentIndex].code}
          </div>
        </div>

        {/* Airport Name */}
        <div className="col-span-6">
          <div className={`text-white text-sm transition-all duration-300 ${
            isFlipping ? 'animate-flip' : ''
          }`}>
            {airports[currentIndex].name}
          </div>
        </div>

        {/* Status */}
        <div className="col-span-2">
          <div className="text-green-400 text-xs font-bold">
            AVAILABLE
          </div>
        </div>

        {/* Gate */}
        <div className="col-span-2">
          <div className="text-amber-400 text-sm font-bold">
            VIP
          </div>
        </div>
      </div>

      {/* Next Row Preview */}
      <div className="grid grid-cols-12 gap-2 items-center py-2 opacity-40 border-t border-amber-400/10">
        <div className="col-span-2">
          <div className="text-amber-400 text-lg font-bold">
            {nextAirport.code}
          </div>
        </div>
        <div className="col-span-6">
          <div className="text-white text-sm">
            {nextAirport.name}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-green-400 text-xs font-bold">
            AVAILABLE
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-amber-400 text-sm font-bold">
            VIP
          </div>
        </div>
      </div>
    </div>
  );
};

const OnboardingScreen = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % onboardingSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + onboardingSlides.length) % onboardingSlides.length);
  };

  const goToHome = () => {
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Onboarding Slides */}
      <div className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out"
             style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {onboardingSlides.map((slide, index) => (
            <div key={index} className="w-full flex-shrink-0 relative">
              <img 
                src={slide.image} 
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-end">
                <div className="p-8 text-white space-y-4">
                  <h2 className="text-3xl font-bold">{slide.title}</h2>
                  <p className="text-lg opacity-90 max-w-md">{slide.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Navigation Controls */}
        <Button
          variant="ghost"
          size="icon"
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
        
        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {onboardingSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Testimonials Carousel */}
      <div className="py-8 px-4">
        <h3 className="text-xl font-semibold text-center mb-6 text-foreground">
          What Our Clients Say
        </h3>
        <div className="flex overflow-x-auto space-x-4 pb-4">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-card p-4 rounded-lg shadow-lg min-w-[280px] flex-shrink-0">
              <div className="flex items-center space-x-3 mb-3">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-medium text-card-foreground">{testimonial.name}</h4>
                  <div className="flex space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground">{testimonial.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mechanical Departures Board */}
      <div className="py-8 px-4 bg-gradient-to-b from-slate-900 to-slate-800">
        <h3 className="text-xl font-semibold text-center mb-6 text-white">
          South Florida Airports We Serve
        </h3>
        <div className="max-w-4xl mx-auto">
          <DeparturesBoard airports={airports} />
          <p className="text-center text-slate-300 text-sm mt-4 opacity-80">
            We proudly serve both international and private airports throughout South Florida
          </p>
        </div>
      </div>

      {/* Continue Button */}
      <div className="p-6">
        <Button 
          variant="luxury" 
          size="lg" 
          onClick={goToHome}
          className="w-full"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default OnboardingScreen;