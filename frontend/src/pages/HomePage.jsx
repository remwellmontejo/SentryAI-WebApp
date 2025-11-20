import React from 'react'
import Navbar from '../components/Navbar'
import HomeTable from '../components/HomeTable.jsx'
import InfoCard from '../components/InfoCard.jsx'
import { CarFront, ClipboardClock, CalendarCheck2, Video } from 'lucide-react'

const HomePage = () => {
  return (
    <div className='min-h-screen' data-theme="corporateBlue">
      <div className='mb-5'>
        <Navbar />
      </div>
      <div className='mx-20'>
        <div className='grid grid-cols-1 gap-6 mb-4 sm:grid-cols-2 lg:grid-cols-4'>
          <InfoCard title="Total Apprehended Cars" content="0" properties="bg-green-400 m-2" properties_for_value="text-base-content">
            <CarFront className='size-20 ' />
          </InfoCard>
          <InfoCard title="Apprehended Today" content="0" properties="bg-red-400 m-2" properties_for_value="text-base-content">
            <CalendarCheck2 className='size-20 ' />
          </InfoCard>
          <InfoCard title="Pending Apprehensions" content="2" properties="bg-yellow-400 m-2" properties_for_value="text-base-content">
            <ClipboardClock className='size-20 ' />
          </InfoCard>
          <InfoCard title="Active Cameras" content="1" properties="bg-blue-400 m-2" properties_for_value="text-base-content">
            <Video className='size-20 ' />
          </InfoCard>
        </div>
        <HomeTable />
      </div>
    </div>
  )
}

export default HomePage
