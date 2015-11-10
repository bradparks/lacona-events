/** @jsx createElement */

import {createElement, Phrase} from 'lacona-phrase'
import String from 'lacona-phrase-string'
import {DateTime, Time, Date as DatePhrase, TimePeriod} from 'lacona-phrase-datetime'
import moment from 'moment'

class LocationWithAt extends Phrase {
  describe () {
    return (
      <sequence>
        <list items={[' at ', ' on ', ' in ']} limit={1} category='conjunction' />
        <argument text='location' merge={true}>
          <freetext limit={1} splitOn=' ' />
        </argument>
      </sequence>
    )
  }
}

export function execute (result) {
  global.createReminder(result.title, result.location, result.startDate, result.endDate, false, 15*60, err => {
    if (err) {
      global.notify('Failed to Create Event', '', err)
    } else {
      global.notify('Created Event', '',  `${result.text} on ${moment(result.date).format('LLL')}`)
    }
  })
}

export class Sentence extends Phrase {
  describe () {
    return (
      <sequence unique={true}>
        <list items={['schedule ', 'create an event ', 'create event ', 'add an event ', 'add event ']} limit={1} category='action' />
        <String limit={1} splitOn=' ' argument='calendar event' id='title' />
        <LocationWithAt optional={true} id='location' prefered={false} />
        <list items={[' for ', ' at ', ' ']} category='conjunction' limit={1} />
        <choice limit={1} merge={true}>
          <DateTime id='datetime' />
          <Time id='time' />
          <DatePhrase id='date' />
          <TimePeriod id='period' />
        </choice>
        <LocationWithAt optional={true} prefered={false} id='location' />
      </sequence>

    )
  }
}
