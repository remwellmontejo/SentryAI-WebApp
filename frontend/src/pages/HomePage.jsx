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
        <div className='grid grid-cols-1 gap-6 mb-10 sm:grid-cols-2 lg:grid-cols-4'>
          <InfoCard title="Total Apprehended Cars" content="256" properties="bg-green-400 m-2">
            <CarFront className='size-20' />
          </InfoCard>
          <InfoCard title="Apprehended Today" content="10" properties="bg-yellow-400 m-2">
            <CalendarCheck2 className='size-20' />
          </InfoCard>
          <InfoCard title="Pending Apprehensions" content="20" properties="bg-red-400 m-2">
            <ClipboardClock className='size-20' />
          </InfoCard>
          <InfoCard title="Active Cameras" content="12" properties="bg-blue-400 m-2">
            <Video className='size-20' />
          </InfoCard>
        </div>
        <HomeTable />
      </div>
    </div>
  )
}

export default HomePage
