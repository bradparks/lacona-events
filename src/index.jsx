/** @jsx createElement */

import { createElement, Phrase } from 'lacona-phrase'
import { createEvent, createReminder, showNotification } from 'lacona-api'
import { String } from 'lacona-phrase-string'
import { DateTime /*, Range */} from 'lacona-phrase-datetime'
import { Command } from 'lacona-command'
import moment from 'moment'

class LocationWithAt extends Phrase {
  describe () {
    return (
      <sequence>
        <list items={[' at ', ' on ', ' in ']} limit={1} category='conjunction' />
        <String argument='location' merge splitOn=' ' limit={1} />
      </sequence>
    )
  }
}

function formatRange (obj) {
  const start = moment(obj.start)
  const end = moment(obj.end)

  if (obj.allday) {
    return [
      {text: 'all day '},
      {text: start.format('dddd, MMMM Do, YYYY'), argument: 'date'},
      {text: ' to all day '},
      {text: end.format('dddd, MMMM Do, YYYY'), argument: 'date'}
    ]
  } else if (end.diff(start, 'days') === 0) {
    return [
      {text: start.format('dddd, MMMM Do, YYYY'), argument: 'date'},
      {text: ' at '},
      {text: start.format('h:mma'), argument: 'time'},
      {text: ' to '},
      {text: end.format('h:mma'), argument: 'time'}
    ]
  } else {
    return [
      {text: start.format('dddd, MMMM Do, YYYY'), argument: 'date'},
      {text: ' at '},
      {text: start.format('h:mma'), argument: 'time'},
      {text: ' to '},
      {text: end.format('dddd, MMMM Do, YYYY'), argument: 'date'},
      {text: ' at '},
      {text: end.format('h:mma'), argument: 'time'},
    ]
  }
}

class ScheduleEventObject {
  constructor({title, location, range}) {
    this.title = title
    this.location = location
    this.range = range
  }

  _demoExecute () {
    return _.flatten([
      {text: 'create an event', category: 'action'},
      {text: ' called '},
      {text: this.title, argument: 'calendar event'},
      this.location ? [{text: ' with location '}, {text: this.location, argument: 'location'}] : [],
      {text: ' '},
      formatRange(this.range)
    ])
  }

  execute () {
    createEvent({
      title: this.title,
      // location: this.location,
      start: this.range.start,
      end: this.range.end,
      allDay: this.range.allDay
    }, (err) => {
      if (err) {
        showNotification({title: 'Failed to Create Event'})
      } else {
        showNotification({
          title: 'Created Event',
          subtitle: this.title,
          content: displayRange(this.range)
        })
      }
    })
  }
}

function displayRange({start, end, allDay}) {
  const startM = moment(start)
  const endM = moment(end)

  if (allDay) {
    if (start === end) {
      return `All Day ${startM.format('LL')}`
    } else {
      return `All Day ${startM.format('LL')} to ${endM.format('LL')}`
    }
  } else {
    if (endM.isAfter(startM, 'day')) {
      return `${startM.format('LLL')} to ${endM.format('LLL')}`
    } else {
      return `${startM.format('LL')} ${startM.format('LT')} to ${endM.format('LT')}`
    }
  }
}

export class ScheduleEvent extends Phrase {
  static extends = [Command]

  describe () {
    return (
      <map function={result => new ScheduleEventObject(result)}>
        <sequence unique={true}>
          <list items={['schedule ', 'create an event ', 'create event ', 'add an event ', 'add event ']} limit={1} category='action' id='verb' value='schedule' />
          <String limit={1} splitOn=' ' argument='calendar event' id='title' />
          {/*<LocationWithAt optional id='location' preferred={false} />*/}
          <literal text=' ' category='conjunction' />
          <literal text='for ' category='conjunction' optional preferred limited />
          <Range id='range' prepositions past={false} seconds={false} />
          {/*<LocationWithAt optional id='location' preferred={false} />*/}
        </sequence>
      </map>
    )
  }
}

function formatDateTime (datetime) {
  const datetimeMoment = moment(datetime)
  return [
    {text: datetimeMoment.format('dddd, MMMM Do, YYYY'), argument: 'date'},
    {text: ' at '},
    {text: datetimeMoment.format('h:mma'), argument: 'time'}
  ]
}

class CreateReminderObject {
  constructor ({title, datetime}) {
    this.title = title
    this.datetime = datetime
  }

  _demoExecute () {
    const datetime = this.datetime ? [{text: ' due '}].concat(formatDateTime(this.datetime)) : {text: ' without a due date'}

    return _.flatten([
      {text: 'create a reminder', category: 'action'},
      {text: ' called '},
      {text: this.title, argument: 'reminder title'},
      datetime
    ]) 
  }

  execute () {
    createReminder({title: this.title, date: this.datetime}, (err) => {
      if (err) {
        showNotification({title: 'Failed to Create Reminder'})
      } else {
        if (this.datetime) {
          showNotification({title: 'Created Reminder', subtitle: this.title, content: `${moment(this.datetime).format('LLL')}`})
        } else {
          showNotification({title: 'Created Reminder', subtitle: this.title})
        }
      }
    })
  }  
}

export class CreateReminder extends Phrase {
  static extends = [Command]

  describe () {
    return (
      <map function={result => new CreateReminderObject(result)}>
        <sequence>
          <list items={['remind me to ', 'create reminder ', 'create a reminder ', 'add a reminder ', 'add reminder ']} limit={1} category='action' id='verb' value='remind' />
          <choice merge>
            <String argument='reminder title' id='title' consumeAll />
            <sequence>
              <String limit={1} argument='reminder title' id='title' splitOn=' ' />
              <literal text=' ' category='conjunction' />
              <DateTime id='datetime' past={false} prepositions seconds={false} />
            </sequence>
          </choice>
        </sequence>
      </map>
    )
  }
}

export const extensions = [CreateReminder]
