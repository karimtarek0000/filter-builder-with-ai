export type Country = "EG" | "SA" | "AE" | "US" | "DE";

export interface Employee {
  id: string;
  name: string;
  country: Country;
  salary: number;
  isActive: boolean;
  hireDate: string;
}

export const employees: Employee[] = [
  { id: "1", name: "Amir Hassan", country: "EG", salary: 4200, isActive: true, hireDate: "2015-01-05" },
  { id: "2", name: "Laila Mostafa", country: "EG", salary: 7600, isActive: true, hireDate: "2016-02-10" },
  { id: "3", name: "Youssef Adel", country: "EG", salary: 3100, isActive: false, hireDate: "2017-03-15" },
  { id: "4", name: "Nour Ibrahim", country: "EG", salary: 9800, isActive: true, hireDate: "2018-04-20" },
  { id: "5", name: "Omar Farouk", country: "EG", salary: 5400, isActive: false, hireDate: "2019-05-25" },
  { id: "6", name: "Salma Nabil", country: "EG", salary: 12500, isActive: true, hireDate: "2020-06-01" },
  { id: "7", name: "Karim Zaki", country: "EG", salary: 6300, isActive: true, hireDate: "2021-07-08" },
  { id: "8", name: "Dina Samir", country: "EG", salary: 2900, isActive: false, hireDate: "2022-08-12" },
  { id: "9", name: "Fahad Al-Otaibi", country: "SA", salary: 8800, isActive: true, hireDate: "2015-09-17" },
  { id: "10", name: "Noura Al-Qahtani", country: "SA", salary: 6100, isActive: true, hireDate: "2016-10-22" },
  { id: "11", name: "Khalid Al-Harbi", country: "SA", salary: 15200, isActive: false, hireDate: "2017-11-27" },
  { id: "12", name: "Reem Al-Dosari", country: "SA", salary: 4700, isActive: true, hireDate: "2018-12-03" },
  { id: "13", name: "Sultan Al-Ghamdi", country: "SA", salary: 9300, isActive: false, hireDate: "2019-01-09" },
  { id: "14", name: "Hind Al-Shehri", country: "SA", salary: 3400, isActive: true, hireDate: "2020-02-14" },
  { id: "15", name: "Bandar Al-Mutairi", country: "SA", salary: 11700, isActive: true, hireDate: "2021-03-19" },
  { id: "16", name: "Amal Al-Zahrani", country: "SA", salary: 5900, isActive: false, hireDate: "2022-04-24" },
  { id: "17", name: "Rashid Al-Maktoum", country: "AE", salary: 10400, isActive: true, hireDate: "2015-05-02" },
  { id: "18", name: "Mariam Al-Nuaimi", country: "AE", salary: 7200, isActive: true, hireDate: "2016-06-07" },
  { id: "19", name: "Hamdan Al-Suwaidi", country: "AE", salary: 3800, isActive: false, hireDate: "2017-07-13" },
  { id: "20", name: "Shamma Al-Falasi", country: "AE", salary: 13900, isActive: true, hireDate: "2018-08-18" },
  { id: "21", name: "Saeed Al-Mansoori", country: "AE", salary: 6600, isActive: false, hireDate: "2019-09-23" },
  { id: "22", name: "Fatima Al-Zaabi", country: "AE", salary: 4100, isActive: true, hireDate: "2020-10-28" },
  { id: "23", name: "Majid Al-Marri", country: "AE", salary: 8700, isActive: true, hireDate: "2021-11-04" },
  { id: "24", name: "Alia Al-Hammadi", country: "AE", salary: 2600, isActive: false, hireDate: "2022-12-09" },
  { id: "25", name: "James Carter", country: "US", salary: 9100, isActive: true, hireDate: "2015-01-15" },
  { id: "26", name: "Emily Johnson", country: "US", salary: 6800, isActive: true, hireDate: "2016-02-20" },
  { id: "27", name: "Michael Brown", country: "US", salary: 14300, isActive: false, hireDate: "2017-03-25" },
  { id: "28", name: "Ashley Davis", country: "US", salary: 5200, isActive: true, hireDate: "2018-04-01" },
  { id: "29", name: "Christopher Wilson", country: "US", salary: 7900, isActive: false, hireDate: "2019-05-08" },
  { id: "30", name: "Jessica Miller", country: "US", salary: 3600, isActive: true, hireDate: "2020-06-12" },
  { id: "31", name: "Matthew Anderson", country: "US", salary: 11200, isActive: true, hireDate: "2021-07-17" },
  { id: "32", name: "Amanda Taylor", country: "US", salary: 4900, isActive: false, hireDate: "2022-08-22" },
  { id: "33", name: "Lukas Schmidt", country: "DE", salary: 8300, isActive: true, hireDate: "2015-09-27" },
  { id: "34", name: "Anna Muller", country: "DE", salary: 6400, isActive: true, hireDate: "2016-10-03" },
  { id: "35", name: "Felix Wagner", country: "DE", salary: 15800, isActive: false, hireDate: "2017-11-09" },
  { id: "36", name: "Hannah Becker", country: "DE", salary: 4500, isActive: true, hireDate: "2018-12-14" },
  { id: "37", name: "Jonas Hoffmann", country: "DE", salary: 7000, isActive: false, hireDate: "2019-01-19" },
  { id: "38", name: "Lea Schneider", country: "DE", salary: 3200, isActive: true, hireDate: "2020-02-24" },
  { id: "39", name: "Paul Richter", country: "DE", salary: 10900, isActive: true, hireDate: "2021-03-28" },
  { id: "40", name: "Sophie Klein", country: "DE", salary: 5700, isActive: false, hireDate: "2022-04-15" },
];
